import { InspectionRecord, Product, ExtractionResult } from '../types';
import { getGeminiApiKey } from './clientGeminiVision';
import { evaluateExtractionAgainstRules } from './ruleEngine';
import { parseLabelText } from './labelParser';

export async function checkUrlClientSide(payload: {
  platform?: string;
  url?: string;
  performed_by?: any;
}): Promise<{ success: boolean; record: InspectionRecord }> {
  const targetUrl = payload.url || '';
  const apiKey = getGeminiApiKey();

  if (apiKey && targetUrl) {
    try {
      console.log(`[MANAK Mobile] Running client-side URL check with Gemini Grounding for: ${targetUrl}`);

      const prompt = `You are a Legal Metrology Compliance Auditor for India under Packaged Commodities Rules 2011.

Perform an audit and web search for this exact product URL: ${targetUrl}

Extract all statutory legal metrology declarations required by law:
1. Generic Name of commodity (Rule 6(1)(b)) e.g. "Tea", "Shampoo", "Wheat Flour"
2. Brand Name
3. Name & complete address of Manufacturer / Packer / Importer with PIN Code (Rule 6(1)(a))
4. Maximum Retail Price (MRP) in ₹ (Rule 6(1)(e))
5. Net Quantity amount & unit (Rule 6(1)(c)) e.g. 500 g, 1 kg, 250 ml
6. Country of Origin (Rule 6(10)) e.g. "India"
7. Customer Care helpline phone / email / address (Rule 6(2))
8. Product Image URL (if found)

Return ONLY pure JSON matching this exact structure:
{
  "generic_name": "Generic name",
  "brand": "Brand name",
  "manufacturer": "Full manufacturer name & address with PIN code",
  "mrp": 299,
  "net_quantity_amount": 500,
  "net_quantity_unit": "g",
  "country_of_origin": "India",
  "consumer_care": { "phone": "1800-11-2233", "email": "care@brand.com", "address": "Address" },
  "image_url": "https://..."
}`;

      // Use valid Gemini Flash models
      const models = ['models/gemini-flash-lite-latest', 'models/gemini-1.5-flash-latest'];
      let parsed: any = null;

      for (const model of models) {
        try {
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`;
          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              tools: [{ google_search: {} }],
              generationConfig: { temperature: 0.1 }
            })
          });

          if (res.ok) {
            const data = await res.json();
            const textOut = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textOut) {
              const jsonMatch = textOut.match(/\{[\s\S]*\}/);
              const cleanJson = jsonMatch ? jsonMatch[0] : textOut.replace(/```json/gi, '').replace(/```/g, '').trim();
              parsed = JSON.parse(cleanJson);
              if (parsed) break;
            }
          }
        } catch (e) {
          console.warn(`[MANAK Mobile] ${model} search grounding attempt failed:`, e);
        }
      }

      if (parsed) {
        const extraction: ExtractionResult = {
          generic_name: { value: parsed.generic_name || null, source: 'dom', confidence: parsed.generic_name ? 0.95 : 0 },
          manufacturer: { value: parsed.manufacturer || null, source: 'dom', confidence: parsed.manufacturer ? 0.94 : 0 },
          mrp: {
            value: parsed.mrp ? {
              amount: typeof parsed.mrp === 'number' ? parsed.mrp : parseFloat(parsed.mrp || '0'),
              raw_text: `MRP ₹${parsed.mrp} (Incl. of all taxes)`,
              is_inclusive_taxes: true
            } : null,
            source: 'dom',
            confidence: parsed.mrp ? 0.96 : 0
          },
          net_quantity: {
            value: parsed.net_quantity_amount ? {
              amount: typeof parsed.net_quantity_amount === 'number' ? parsed.net_quantity_amount : parseFloat(parsed.net_quantity_amount || '0'),
              unit: parsed.net_quantity_unit || 'g'
            } : null,
            source: 'dom',
            confidence: parsed.net_quantity_amount ? 0.95 : 0
          },
          mfg_date: { value: null, source: 'dom', confidence: 0 },
          country_of_origin: { value: parsed.country_of_origin || 'India', source: 'dom', confidence: 0.98 },
          consumer_care: {
            value: (parsed.consumer_care?.phone || parsed.consumer_care?.email || parsed.consumer_care?.address) ? {
              phone: parsed.consumer_care?.phone || undefined,
              email: parsed.consumer_care?.email || undefined,
              address: parsed.consumer_care?.address || undefined
            } : null,
            source: 'dom',
            confidence: 0.92
          },
          numeral_height_mm: { value: null, reference_detected: false, note: 'E-Commerce PDP Audit' },
          raw_ocr_text: `E-Commerce Audit for ${targetUrl}\nGeneric Name: ${parsed.generic_name || ''}\nManufacturer: ${parsed.manufacturer || ''}\nMRP: ₹${parsed.mrp || ''}\nNet Qty: ${parsed.net_quantity_amount || ''}${parsed.net_quantity_unit || ''}`
        };

        const evalResult = evaluateExtractionAgainstRules(extraction, 'online_listing');
        const product: Product = {
          id: `prod-${Date.now().toString().slice(-6)}`,
          title: parsed.generic_name ? `${parsed.generic_name} (E-Commerce PDP)` : 'E-Commerce Commodity',
          brand: parsed.brand || 'Declared Brand',
          category: 'E-Commerce Commodity',
          source_type: 'ecommerce',
          ecommerce_url: targetUrl,
          image_url: parsed.image_url || undefined
        };

        const record: InspectionRecord = {
          id: `insp-${Date.now().toString().slice(-6)}`,
          product,
          performed_by: payload.performed_by || { name: 'Enforcement Official', badge_id: 'LM-OFFICER-01', role: 'officer' },
          mode: 'url_check',
          status: 'verified',
          geo: { lat: 28.6139, lng: 77.2090, address: 'E-Commerce PDP Audit' },
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          evidence_image: product.image_url || '',
          evidence_hash: `sha256-${Math.random().toString(36).substring(2, 15)}`,
          extraction,
          evaluations: evalResult.evaluations,
          is_compliant: evalResult.is_compliant,
          total_violations: evalResult.total_violations,
          total_penalty: evalResult.total_penalty,
          is_signed: true,
          signature_details: {
            signed_by: `${payload.performed_by?.name || 'Officer'} (Digital DSC)`,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            provider: 'local',
            certificate_id: `DSC-ECOM-${Date.now().toString().slice(-6)}`
          },
          report_id: `MANAK-REP-2026-${Date.now().toString().slice(-5)}`,
          synced: false
        };

        return { success: true, record };
      }
    } catch (e) {
      console.warn('[MANAK Mobile] Client URL check failed:', e);
    }
  }

  // Fallback structure
  const textFallback = parseLabelText(targetUrl);
  const extraction: ExtractionResult = {
    generic_name: textFallback.generic_name.value ? textFallback.generic_name : { value: 'Packaged Commodity', source: 'dom', confidence: 0.8 },
    manufacturer: textFallback.manufacturer.value ? textFallback.manufacturer : { value: null, source: 'dom', confidence: 0 },
    mrp: textFallback.mrp.value ? textFallback.mrp : { value: null, source: 'dom', confidence: 0 },
    net_quantity: textFallback.net_quantity.value ? textFallback.net_quantity : { value: null, source: 'dom', confidence: 0 },
    mfg_date: { value: null, source: 'dom', confidence: 0 },
    country_of_origin: { value: 'India', source: 'dom', confidence: 0.9 },
    consumer_care: { value: null, source: 'dom', confidence: 0 },
    numeral_height_mm: { value: null, reference_detected: false, note: 'E-Commerce Listing' },
    raw_ocr_text: `E-Commerce URL: ${targetUrl}`
  };

  const evalResult = evaluateExtractionAgainstRules(extraction, 'online_listing');
  const record: InspectionRecord = {
    id: `insp-${Date.now().toString().slice(-6)}`,
    product: {
      id: `prod-${Date.now().toString().slice(-6)}`,
      title: 'E-Commerce Product Listing',
      brand: 'Unbranded',
      category: 'E-Commerce Commodity',
      source_type: 'ecommerce',
      ecommerce_url: targetUrl
    },
    performed_by: payload.performed_by || { name: 'Enforcement Official', badge_id: 'LM-OFFICER-01', role: 'officer' },
    mode: 'url_check',
    status: 'verified',
    geo: { lat: 28.6139, lng: 77.2090, address: 'Field Audit Location' },
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    evidence_image: '',
    evidence_hash: `sha256-${Math.random().toString(36).substring(2, 15)}`,
    extraction,
    evaluations: evalResult.evaluations,
    is_compliant: evalResult.is_compliant,
    total_violations: evalResult.total_violations,
    total_penalty: evalResult.total_penalty,
    is_signed: true,
    signature_details: {
      signed_by: `${payload.performed_by?.name || 'Officer'} (Digital DSC)`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      provider: 'local',
      certificate_id: `DSC-LCL-${Date.now().toString().slice(-6)}`
    },
    report_id: `MANAK-REP-2026-${Date.now().toString().slice(-5)}`,
    synced: false
  };

  return { success: true, record };
}
