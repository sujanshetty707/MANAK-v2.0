import { Product, ExtractionResult } from '../types';
import { SAMPLE_PRODUCTS } from '../data/mockData';
import { parseLabelText } from './labelParser';

export { parseLabelText };

export interface PipelineStage {
  id: string;
  name: string;
  detail: string;
  progress: number;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'preprocess', name: 'Image Preprocessing & Edge Detection', detail: 'Normalizing perspective, anti-glare filtering, and reference scale calibration...', progress: 20 },
  { id: 'ocr', name: 'Gemini Vision OCR Multi-region Scan', detail: 'Extracting multilingual text bounding boxes across principal display panel...', progress: 45 },
  { id: 'entities', name: 'Structured Entity Normalization', detail: 'Parsing Manufacturer, Net Quantity, MRP format, Dates, and Consumer Care...', progress: 70 },
  { id: 'rules', name: 'Deterministic 2011 Rules Engine', detail: 'Evaluating statutory declarations against Gazette Notification GSR 202(E)...', progress: 88 },
  { id: 'rag', name: 'RAG Statutory Citation Retrieval', detail: 'Assembling legal clauses and audit-ready verification hashes...', progress: 100 }
];

export async function simulateExtractionPipeline(
  source: { type: 'camera' | 'upload' | 'url'; data: string; sampleIndex?: number },
  onProgress?: (stage: PipelineStage, currentIdx: number) => void
): Promise<{ product: Product; extraction: ExtractionResult }> {
  // Determine product & extraction based on source
  let targetSample = SAMPLE_PRODUCTS[0];

  if (source.sampleIndex !== undefined && SAMPLE_PRODUCTS[source.sampleIndex]) {
    targetSample = SAMPLE_PRODUCTS[source.sampleIndex];
  } else if (source.type === 'url') {
    const isViolatingUrl = source.data.toLowerCase().includes('flipkart') || source.data.toLowerCase().includes('imported') || source.data.toLowerCase().includes('olive');
    targetSample = isViolatingUrl ? SAMPLE_PRODUCTS[3] : SAMPLE_PRODUCTS[0];
  } else {
    targetSample = SAMPLE_PRODUCTS[1]; // default non-compliant sample for custom scans
  }

  // Progressive simulated delay through pipeline stages
  for (let i = 0; i < PIPELINE_STAGES.length; i++) {
    const stage = PIPELINE_STAGES[i];
    if (onProgress) {
      onProgress(stage, i);
    }
    // Realistic micro-delay
    await new Promise(resolve => setTimeout(resolve, 600));
  }

  return {
    product: {
      ...targetSample.product,
      id: `prod-${Date.now()}`,
      ecommerce_url: source.type === 'url' ? source.data : undefined
    },
    extraction: JSON.parse(JSON.stringify(targetSample.extraction))
  };
}
