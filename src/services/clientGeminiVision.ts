import { ExtractionResult, Product } from '../types';
import { parseLabelText } from './labelParser';

export function getGeminiApiKey(): string {
  const savedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('MANAK_GEMINI_KEY') : null;
  if (savedKey && savedKey.trim()) return savedKey.trim();
  return (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY || '';
}

export async function extractLabelClientSide(payload: {
  image_base64?: string;
  images_base64?: string[] | string;
  raw_text?: string;
}): Promise<{ success: boolean; extraction: ExtractionResult; product: Product }> {
  const apiKey = getGeminiApiKey();

  const primaryImg = Array.isArray(payload.images_base64)
    ? payload.images_base64[0]
    : (payload.image_base64 || (typeof payload.images_base64 === 'string' ? payload.images_base64 : undefined));
  const allImages = Array.isArray(payload.images_base64)
    ? payload.images_base64
    : (primaryImg ? [primaryImg] : []);

  // Filter and format images for Gemini inline_data
  const imageParts: any[] = [];
  for (const imgStr of allImages) {
    if (!imgStr || typeof imgStr !== 'string') continue;
    let cleanBase64 = imgStr;
    let mimeType = 'image/jpeg';

    if (imgStr.startsWith('data:')) {
      const commaIdx = imgStr.indexOf(',');
      if (commaIdx !== -1) {
        const header = imgStr.slice(0, commaIdx);
        const mimeMatch = header.match(/^data:(image\/[a-zA-Z+]+)/);
        if (mimeMatch) mimeType = mimeMatch[1];
        cleanBase64 = imgStr.slice(commaIdx + 1);
      }
    }
    cleanBase64 = cleanBase64.replace(/\s/g, '');
    if (cleanBase64.length > 100) {
      imageParts.push({
        inline_data: {
          mime_type: mimeType,
          data: cleanBase64
        }
      });
    }
  }

  // If Gemini API Key is available and we have images, run client-side Gemini 3.6 Flash
  if (apiKey && imageParts.length > 0) {
    try {
      console.log(`[MANAK Mobile] Running direct client-side Gemini Vision OCR on ${imageParts.length} image(s)...`);

      const prompt = `You are Google Lens / Legal Metrology Compliance OCR Engine for packaged products in India under the Legal Metrology (Packaged Commodities) Rules, 2011.

Examine all provided packaging photo(s) and extract every statutory declaration:
- Generic commodity name (Rule 6(1)(b))
- Brand name
- Manufacturer / Packer / Importer name & full address with PIN code (Rule 6(1)(a))
- Maximum Retail Price (MRP) in Rupees, inclusive of all taxes (Rule 6(1)(e))
- Net quantity & standard unit (g, kg, ml, l, pcs) (Rule 6(1)(c))
- Manufacturing / packaging date (MM/YYYY or DD/MM/YYYY) (Rule 6(1)(d))
- Expiry date / Best before declaration (Rule 6(1)(d))
- Country of Origin (e.g. India) (Rule 6(10))
- Consumer grievance care details: phone, email, address (Rule 6(1)(n))
- Comprehensive raw OCR text of all visible words.

Return ONLY a single valid JSON object:
{
  "generic_name": "Generic name of commodity",
  "brand": "Brand name",
  "manufacturer": "Full manufacturer name and address with PIN code",
  "mrp": { "amount": 20, "raw_text": "MRP Rs. 20.00 (Incl. of all taxes)", "is_inclusive_taxes": true },
  "net_quantity": { "amount": 100, "unit": "g" },
  "mfg_date": "08/2026",
  "expiry_date": "08/2027",
  "country_of_origin": "India",
  "consumer_care": { "phone": "1800-22-5555", "email": "care@brand.com", "address": "Customer Care Manager" },
  "category": "Packaged Retail Commodity",
  "raw_ocr_text": "Verbatim text"
}`;

      const models = ['models/gemini-flash-lite-latest', 'models/gemini-2.0-flash'];
      let response: Response | null = null;

      for (const model of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`;
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }, ...imageParts] }],
              generationConfig: { temperature: 0.1 }
            })
          });
          if (res.ok) {
            response = res;
            break;
          }
        } catch (e) {
          console.warn(`[MANAK Mobile] Model ${model} fetch failed:`, e);
        }
      }

      if (response && response.ok) {
        const data = await response.json();
        const textOut = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textOut) {
          const jsonMatch = textOut.match(/\{[\s\S]*\}/);
          const cleanJson = jsonMatch ? jsonMatch[0] : textOut.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);

          const parseNum = (v: any) => {
            if (typeof v === 'number') return isNaN(v) ? 0 : v;
            if (typeof v === 'string') {
              const m = v.match(/[\d\.]+/);
              return m ? parseFloat(m[0]) : 0;
            }
            return 0;
          };

          const mrpAmt = parseNum(parsed.mrp?.amount !== undefined ? parsed.mrp.amount : parsed.mrp);
          const netQtyAmt = parseNum(parsed.net_quantity?.amount !== undefined ? parsed.net_quantity.amount : parsed.net_quantity);
          const netQtyUnit = parsed.net_quantity?.unit || '';
          const rawOcr = parsed.raw_ocr_text || '';

          const extraction: ExtractionResult = {
            generic_name: { value: parsed.generic_name || '', source: 'ocr', confidence: 0.96 },
            manufacturer: { value: parsed.manufacturer || '', source: 'ocr', confidence: 0.95 },
            mrp: {
              value: {
                amount: mrpAmt,
                raw_text: parsed.mrp?.raw_text || (mrpAmt > 0 ? `MRP Rs. ${mrpAmt.toFixed(2)} (Incl. of all taxes)` : ''),
                is_inclusive_taxes: parsed.mrp?.is_inclusive_taxes ?? true
              },
              source: 'ocr',
              confidence: 0.98
            },
            net_quantity: {
              value: { amount: netQtyAmt, unit: netQtyUnit || 'g' },
              source: 'ocr',
              confidence: 0.97
            },
            mfg_date: { value: parsed.mfg_date || '', source: 'ocr', confidence: 0.95 },
            expiry_date: parsed.expiry_date ? { value: parsed.expiry_date, source: 'ocr', confidence: 0.95 } : undefined,
            country_of_origin: { value: parsed.country_of_origin || 'India', source: 'ocr', confidence: 0.98 },
            consumer_care: {
              value: {
                phone: parsed.consumer_care?.phone || '',
                email: parsed.consumer_care?.email || '',
                address: parsed.consumer_care?.address || ''
              },
              source: 'ocr',
              confidence: 0.94
            },
            numeral_height_mm: { value: null, reference_detected: false, note: 'Rule 7 numeral height estimation' },
            raw_ocr_text: rawOcr
          };

          const product: Product = {
            id: `prod-${Date.now().toString().slice(-6)}`,
            title: extraction.generic_name.value ? `${extraction.generic_name.value} Pack` : (parsed.brand ? `${parsed.brand} Product` : 'Packaged Commodity'),
            brand: parsed.brand || (extraction.manufacturer.value ? extraction.manufacturer.value.split(',')[0].trim() : 'Declared Manufacturer'),
            category: parsed.category || 'Packaged Retail Commodity',
            source_type: 'store',
            image_url: primaryImg,
            images: allImages
          };

          return { success: true, extraction, product };
        }
      }
    } catch (err) {
      console.warn('[MANAK Mobile] Direct Gemini Vision call failed:', err);
    }
  }

  // Fallback to local regex parser if no key or API failed
  const extraction = parseLabelText(payload.raw_text || '');
  const product: Product = {
    id: `prod-${Date.now().toString().slice(-6)}`,
    title: extraction.generic_name.value ? `${extraction.generic_name.value} Pack` : 'Packaged Commodity',
    brand: extraction.manufacturer.value ? extraction.manufacturer.value.split(',')[0].trim() : 'Declared Manufacturer',
    category: 'Packaged Retail Commodity',
    source_type: 'store',
    image_url: primaryImg,
    images: allImages
  };

  return { success: true, extraction, product };
}
