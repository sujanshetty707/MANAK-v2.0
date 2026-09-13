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
  { id: 'ingest', name: 'Ingesting Verified Declarations', detail: 'Validating verified packaging data payload and metadata...', progress: 20 },
  { id: 'rules', name: 'PCR 2011 Rule Engine Evaluation', detail: 'Evaluating 8 statutory clauses against Gazette Notification GSR 202(E)...', progress: 45 },
  { id: 'penalties', name: 'Legal Citations & Fine Calculation', detail: 'Mapping non-compliances to statutory sections & Rule 32 penalties...', progress: 70 },
  { id: 'hash', name: 'Cryptographic Hashing & DSC Verification', detail: 'Generating SHA-256 evidence hash and digital signature token...', progress: 90 },
  { id: 'report', name: 'Audit Report Assembly', detail: 'Finalizing legal metrology inspection report for record...', progress: 100 }
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
