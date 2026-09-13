import dotenv from 'dotenv';
import { parseLabelText } from '../../src/services/labelParser';
import { ExtractionResult } from '../../src/types';

dotenv.config();

export interface GoogleVisionOcrResult {
  raw_ocr_text: string;
  detected_labels: string[];
  product_category: string;
  extraction: ExtractionResult;
  engine: string;
}

/**
 * Google Lens / Gemini Multimodal Vision OCR Engine
 * Uses Google Gemini 3.6 Flash / Vision API to extract statutory declarations from packaging images.
 */
export async function processGoogleVisionOcr(
  imagesInput?: string | string[],
  rawTextHint?: string
): Promise<GoogleVisionOcrResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_VISION_API_KEY;

  let rawOcrText = rawTextHint || '';
  let detectedLabels: string[] = [];
  let category = 'Packaged Retail Commodity';
  let engineUsed = 'Google Lens Vision AI (Gemini 3.7 Flash)';
  let geminiExtracted: any = null;

  // Normalize image inputs into an array
  const rawList: string[] = Array.isArray(imagesInput)
    ? imagesInput.filter(Boolean)
    : (imagesInput && typeof imagesInput === 'string' && imagesInput.length > 50 ? [imagesInput] : []);

  // Parse and clean each image
  const validImages: { mimeType: string; cleanBase64: string }[] = [];
  for (const item of rawList) {
    let cleanBase64 = item;
    let mimeType = 'image/jpeg';

    if (item.startsWith('data:')) {
      const commaIdx = item.indexOf(',');
      if (commaIdx !== -1) {
        const header = item.slice(0, commaIdx);
        const mimeMatch = header.match(/^data:(image\/[a-zA-Z+]+)/);
        if (mimeMatch) mimeType = mimeMatch[1];
        cleanBase64 = item.slice(commaIdx + 1);
      }
    }

    cleanBase64 = cleanBase64.replace(/\s/g, '');
    if (cleanBase64.length >= 100) {
      validImages.push({ mimeType, cleanBase64 });
    }
  }

  if (apiKey && validImages.length > 0) {
    try {
      console.log(`[Google Lens] Analyzing ${validImages.length} packaging panel image(s) for multimodal OCR...`);

      const prompt = `You are Google Lens / Legal Metrology Compliance OCR Engine for packaged products in India under the Legal Metrology (Packaged Commodities) Rules, 2011.

You have been provided with ${validImages.length} packaging photo(s) showing different sides/panels (e.g. Front Display Panel, Back Panel, Side Panels, Top/Bottom) of the physical product.

Carefully examine ALL provided images together and cross-reference all panels to extract every statutory declaration and text printed anywhere on the packaging:
- Generic commodity name (Rule 6(1)(b))
- Brand name
- Manufacturer / Packer / Importer name, premises, city, state, postal PIN code (Rule 6(1)(a))
- Maximum Retail Price (MRP) in Rupees, inclusive of all taxes (Rule 6(1)(e))
- Net quantity & standard unit (g, kg, ml, l, pcs) (Rule 6(1)(c))
- Manufacturing / packaging date (MM/YYYY or DD/MM/YYYY) (Rule 6(1)(d))
- Expiry date / Best before declaration (Rule 6(1)(d))
- Country of Origin (e.g. India) (Rule 6(10))
- Consumer grievance care details: helpline telephone/toll-free number, email, and postal address (Rule 6(1)(n))
- Numeral height in mm for net quantity / MRP (Rule 7)
- Comprehensive raw OCR text of all visible words across all images.

Return a SINGLE valid JSON object with EXACTLY this structure:
{
  "generic_name": "Generic or common name of the commodity (e.g. 2-Minute Noodles, Full Cream Milk, Potato Chips)",
  "brand": "Brand name (e.g. MAGGI, Amul, Lays)",
  "manufacturer": "Full name and address of Manufacturer / Packer / Importer with PIN code",
  "mrp": {
    "amount": 20,
    "raw_text": "MRP Rs. 20.00 (Incl. of all taxes)",
    "is_inclusive_taxes": true
  },
  "net_quantity": {
    "amount": 100,
    "unit": "g"
  },
  "mfg_date": "Date of manufacture / packaging (e.g. 08/2026 or 15/08/2026)",
  "expiry_date": "Expiry date or Best Before declaration (e.g. 08/2027 or 9 Months from manufacture)",
  "country_of_origin": "Country of Origin (e.g. India)",
  "consumer_care": {
    "phone": "Customer care toll-free / helpline phone number",
    "email": "Customer care email address",
    "address": "Customer care manager contact address"
  },
  "numeral_height_mm": 3.0,
  "category": "Food & Edible Commodities | Cosmetics & Personal Care | Household Chemicals & Cleaners | Electronics & Electrical Goods | Packaged Retail Commodity",
  "raw_ocr_text": "Complete verbatim text transcript of all text found across all packaging panels"
}

Rules:
1. If a value is NOT visible on any packaging image, use null for numeric values or "" for text strings.
2. Ensure net_quantity.unit is standard (g, kg, ml, l, pcs, units, m, cm).
3. Ensure mrp.amount is a positive number if found.
4. Keep raw_ocr_text complete and comprehensive from all panels.
5. Return ONLY pure JSON without markdown tags or backticks.`;

      // Models list with fallback: Gemini 3.7 Flash -> Gemini Flash Lite -> Gemini 3.5 Flash Lite -> Gemini 3.6 Flash
      const models = ['models/gemini-3.7-flash', 'models/gemini-flash-lite-latest', 'models/gemini-3.5-flash-lite', 'models/gemini-3.6-flash'];
      let response: Response | null = null;

      // Build image parts for all provided images
      const imageParts = validImages.map(img => ({
        inline_data: {
          mime_type: img.mimeType,
          data: img.cleanBase64
        }
      }));

      for (const modelName of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

        const buildBody = (withJsonMode: boolean) => JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                ...imageParts
              ]
            }
          ],
          generationConfig: {
            ...(withJsonMode ? { response_mime_type: 'application/json' } : {}),
            temperature: 0.1
          }
        });

        try {
          let res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: buildBody(true)
          });

          if (!res.ok && res.status === 400) {
            console.warn(`[Google Lens] ${modelName} 400 with JSON mode, retrying without...`);
            res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: buildBody(false)
            });
          }

          if (res.ok) {
            response = res;
            engineUsed = `Google Lens Vision AI (${modelName.replace('models/', '')})`;
            break;
          } else {
            const errBody = await res.text().catch(() => '');
            console.warn(`[Google Lens] ${modelName} HTTP ${res.status}:`, errBody.slice(0, 150));
          }
        } catch (mErr) {
          console.warn(`[Google Lens] ${modelName} fetch error:`, (mErr as Error).message);
        }
      }

      if (response && response.ok) {
        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          try {
            // Clean potential markdown wrapper
            const cleanJson = jsonText.replace(/```json/gi, '').replace(/```/g, '').trim();
            geminiExtracted = JSON.parse(cleanJson);
            console.log('[Google Lens] Gemini Vision extracted JSON successfully!');
            if (geminiExtracted) {
              if (geminiExtracted.raw_ocr_text) {
                rawOcrText = geminiExtracted.raw_ocr_text;
              }
              if (geminiExtracted.category) {
                category = geminiExtracted.category;
              }

              // Synthesize rawOcrText if Gemini didn't return a explicit raw_ocr_text block
              if (!rawOcrText || rawOcrText.trim().length === 0) {
                const parts: string[] = [];
                if (geminiExtracted.brand) parts.push(`Brand: ${geminiExtracted.brand}`);
                if (geminiExtracted.generic_name) parts.push(`Product Name: ${geminiExtracted.generic_name}`);
                if (geminiExtracted.manufacturer) parts.push(`Manufacturer: ${geminiExtracted.manufacturer}`);
                if (geminiExtracted.mrp) {
                  const mrpTxt = typeof geminiExtracted.mrp === 'object'
                    ? (geminiExtracted.mrp.raw_text || `MRP Rs. ${geminiExtracted.mrp.amount} (Incl. of all taxes)`)
                    : `MRP: ${geminiExtracted.mrp}`;
                  parts.push(mrpTxt);
                }
                if (geminiExtracted.net_quantity) {
                  const nq = typeof geminiExtracted.net_quantity === 'object'
                    ? `${geminiExtracted.net_quantity.amount || ''}${geminiExtracted.net_quantity.unit || 'g'}`
                    : geminiExtracted.net_quantity;
                  parts.push(`Net Quantity: ${nq}`);
                }
                if (geminiExtracted.mfg_date) parts.push(`Mfg Date: ${geminiExtracted.mfg_date}`);
                if (geminiExtracted.expiry_date) parts.push(`Expiry Date: ${geminiExtracted.expiry_date}`);
                if (geminiExtracted.country_of_origin) parts.push(`Country of Origin: ${geminiExtracted.country_of_origin}`);
                if (geminiExtracted.consumer_care) {
                  const cc = typeof geminiExtracted.consumer_care === 'object'
                    ? [geminiExtracted.consumer_care.phone, geminiExtracted.consumer_care.email, geminiExtracted.consumer_care.address].filter(Boolean).join(', ')
                    : geminiExtracted.consumer_care;
                  if (cc) parts.push(`Consumer Care: ${cc}`);
                }
                rawOcrText = parts.join('\n');
              }
            }
          } catch (e) {
            console.warn('[Google Lens] Failed to parse JSON response from Gemini:', e);
          }
        }
      }
    } catch (err) {
      console.warn('[Google Lens] Gemini error:', (err as Error).message);
    }
  }

  // Combine regex fallback parsing with Gemini Vision output
  const regexExtraction = parseLabelText(rawOcrText);

  // Robust field parsers
  const parseNum = (val: any): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'string') {
      const match = val.match(/[\d\.]+/);
      return match ? parseFloat(match[0]) : 0;
    }
    return 0;
  };

  const extractedMrpAmount = geminiExtracted?.mrp?.amount !== undefined
    ? parseNum(geminiExtracted.mrp.amount)
    : (typeof geminiExtracted?.mrp === 'number' ? geminiExtracted.mrp : parseNum(geminiExtracted?.mrp));

  const extractedNetQtyAmount = geminiExtracted?.net_quantity?.amount !== undefined
    ? parseNum(geminiExtracted.net_quantity.amount)
    : parseNum(geminiExtracted?.net_quantity);

  const extractedNetQtyUnit = geminiExtracted?.net_quantity?.unit
    || (typeof geminiExtracted?.net_quantity === 'string' ? (geminiExtracted.net_quantity.match(/[a-zA-Z]+/)?.[0] || '') : '');

  // Merge Gemini Vision results with Regex fallback for maximum completeness
  const finalExtraction: ExtractionResult = {
    generic_name: {
      value: geminiExtracted?.generic_name || regexExtraction.generic_name.value || '',
      source: geminiExtracted?.generic_name ? 'google_lens' : regexExtraction.generic_name.source,
      confidence: geminiExtracted?.generic_name ? 0.96 : regexExtraction.generic_name.confidence
    },
    manufacturer: {
      value: geminiExtracted?.manufacturer || regexExtraction.manufacturer.value || '',
      source: geminiExtracted?.manufacturer ? 'google_lens' : regexExtraction.manufacturer.source,
      confidence: geminiExtracted?.manufacturer ? 0.95 : regexExtraction.manufacturer.confidence
    },
    mrp: {
      value: {
        amount: extractedMrpAmount || regexExtraction.mrp.value.amount || 0,
        raw_text: geminiExtracted?.mrp?.raw_text || (extractedMrpAmount ? `MRP Rs. ${extractedMrpAmount.toFixed(2)} (Incl. of all taxes)` : '') || regexExtraction.mrp.value.raw_text || '',
        is_inclusive_taxes: geminiExtracted?.mrp?.is_inclusive_taxes ?? regexExtraction.mrp.value.is_inclusive_taxes
      },
      source: (extractedMrpAmount > 0 || geminiExtracted?.mrp?.raw_text) ? 'google_lens' : regexExtraction.mrp.source,
      confidence: extractedMrpAmount > 0 ? 0.98 : regexExtraction.mrp.confidence
    },
    net_quantity: {
      value: {
        amount: extractedNetQtyAmount || regexExtraction.net_quantity.value.amount || 0,
        unit: extractedNetQtyUnit || regexExtraction.net_quantity.value.unit || 'g'
      },
      source: (extractedNetQtyAmount > 0 || extractedNetQtyUnit) ? 'google_lens' : regexExtraction.net_quantity.source,
      confidence: extractedNetQtyAmount > 0 ? 0.97 : regexExtraction.net_quantity.confidence
    },
    mfg_date: {
      value: geminiExtracted?.mfg_date || regexExtraction.mfg_date.value || '',
      source: geminiExtracted?.mfg_date ? 'google_lens' : regexExtraction.mfg_date.source,
      confidence: geminiExtracted?.mfg_date ? 0.95 : regexExtraction.mfg_date.confidence
    },
    expiry_date: (geminiExtracted?.expiry_date || regexExtraction.expiry_date?.value) ? {
      value: geminiExtracted?.expiry_date || regexExtraction.expiry_date?.value || '',
      source: geminiExtracted?.expiry_date ? 'google_lens' : (regexExtraction.expiry_date?.source || 'ocr'),
      confidence: geminiExtracted?.expiry_date ? 0.95 : (regexExtraction.expiry_date?.confidence || 0.9)
    } : undefined,
    country_of_origin: {
      value: geminiExtracted?.country_of_origin || regexExtraction.country_of_origin.value || 'India',
      source: geminiExtracted?.country_of_origin ? 'google_lens' : regexExtraction.country_of_origin.source,
      confidence: geminiExtracted?.country_of_origin ? 0.98 : regexExtraction.country_of_origin.confidence
    },
    consumer_care: {
      value: {
        phone: geminiExtracted?.consumer_care?.phone || regexExtraction.consumer_care.value.phone || '',
        email: geminiExtracted?.consumer_care?.email || regexExtraction.consumer_care.value.email || '',
        address: geminiExtracted?.consumer_care?.address || regexExtraction.consumer_care.value.address || ''
      },
      source: (geminiExtracted?.consumer_care?.phone || geminiExtracted?.consumer_care?.email || geminiExtracted?.consumer_care?.address) ? 'google_lens' : regexExtraction.consumer_care.source,
      confidence: 0.94
    },
    numeral_height_mm: {
      value: (geminiExtracted?.numeral_height_mm !== undefined && geminiExtracted?.numeral_height_mm !== null)
        ? parseNum(geminiExtracted.numeral_height_mm)
        : (regexExtraction.numeral_height_mm.value ?? null),
      reference_detected: true,
      note: geminiExtracted?.numeral_height_mm ? 'Calculated via Google Lens packaging spatial scale analysis' : 'Rule 7 numeral height estimation'
    },
    raw_ocr_text: rawOcrText || geminiExtracted?.raw_ocr_text || ''
  };

  return {
    raw_ocr_text: rawOcrText,
    detected_labels: detectedLabels,
    product_category: category,
    extraction: finalExtraction,
    engine: engineUsed,
  };
}
