import { createWorker } from 'tesseract.js';
import dotenv from 'dotenv';
import { parseLabelText } from '../../src/services/labelParser';
import { ExtractionResult } from '../../src/types';
import { processGoogleVisionOcr } from './googleVisionOcr';

dotenv.config();

const API_KEY = () => process.env.GOOGLE_VISION_API_KEY || process.env.GEMINI_API_KEY || '';

/**
 * Tesseract.js local OCR fallback.
 */
async function tesseractOcr(imageBase64: string): Promise<string> {
  let worker: any = null;
  try {
    worker = await createWorker('eng');
    const img = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;
    const ret = await worker.recognize(img);
    console.log(`[Tesseract] Extracted ${ret.data.text?.length ?? 0} chars`);
    return ret.data.text || '';
  } catch (err) {
    console.warn('[Tesseract] Error:', (err as Error).message);
    return '';
  } finally {
    if (worker) await worker.terminate().catch(() => {});
  }
}

/**
 * Main pipeline:
 *   1. Google Lens / Gemini Multimodal Vision API (if API key present + image provided)
 *   2. Tesseract.js local OCR   (fallback when Vision fails / no key)
 *   3. Regex parser on raw text (always runs on whatever text we got)
 */
export async function extractLabelFromImage(
  imagesInput?: string | string[],
  rawTextHint?: string
): Promise<{ extraction: ExtractionResult; rawText: string; engine: string; category?: string }> {

  const imagesList = Array.isArray(imagesInput)
    ? imagesInput.filter(Boolean)
    : (imagesInput && typeof imagesInput === 'string' && imagesInput.length > 50 ? [imagesInput] : []);

  const hasImage = imagesList.length > 0;
  const key = API_KEY();
  const hasKey = !!key && key.trim().length > 5;

  // ── Option A: Google Lens Multimodal Vision OCR ─────────────────────────
  if (hasKey && hasImage) {
    try {
      const visionRes = await processGoogleVisionOcr(imagesList, rawTextHint);
      // Check if Google Lens Vision AI extracted meaningful data
      const hasExtractedData =
        visionRes.engine.includes('Google Lens') &&
        (
          visionRes.raw_ocr_text.trim().length > 0 ||
          !!visionRes.extraction?.generic_name?.value ||
          !!visionRes.extraction?.manufacturer?.value ||
          (visionRes.extraction?.mrp?.value?.amount ?? 0) > 0 ||
          (visionRes.extraction?.net_quantity?.value?.amount ?? 0) > 0 ||
          !!visionRes.extraction?.mfg_date?.value ||
          !!visionRes.extraction?.consumer_care?.value?.phone
        );

      if (hasExtractedData) {
        console.log(`[OCR] Successfully processed ${imagesList.length} image(s) with ${visionRes.engine}`);
        return {
          extraction: visionRes.extraction,
          rawText:    visionRes.raw_ocr_text,
          engine:     visionRes.engine,
          category:   visionRes.product_category,
        };
      }
      console.warn('[OCR] Google Lens returned empty result, falling back to Tesseract');
    } catch (err) {
      console.warn('[OCR] Google Lens failed, falling back to Tesseract:', (err as Error).message);
    }
  }

  // ── Option B: Tesseract local OCR ────────────────────────────────────────
  let rawText = rawTextHint || '';
  let engine  = 'PCR-2011 Regex Parser';

  if (hasImage) {
    const firstImg = imagesList[0];
    const tessText = await tesseractOcr(firstImg);
    if (tessText.trim()) {
      rawText = tessText + (rawTextHint ? `\n${rawTextHint}` : '');
      engine  = 'Tesseract.js OCR + PCR-2011 Regex Parser';
    }
  }

  // ── Option C: Regex parse on any raw text (no image case) ────────────────
  console.log(`[OCR] Parsing ${rawText.length} chars with ${engine}`);
  const extraction = parseLabelText(rawText);
  return { extraction, rawText, engine };
}
