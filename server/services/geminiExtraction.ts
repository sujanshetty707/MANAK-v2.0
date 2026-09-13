import { extractLabelFromImage } from './ocrService';
import { ExtractionResult } from '../../src/types';

export async function extractLabelWithGemini(imageBase64?: string, rawTextHint?: string): Promise<ExtractionResult> {
  const result = await extractLabelFromImage(imageBase64, rawTextHint);
  return result.extraction;
}

