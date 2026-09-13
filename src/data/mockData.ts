import { Product, ExtractionResult, InspectionRecord, ConsumerReport } from '../types';

export const SAMPLE_PRODUCTS: Array<{
  product: Product;
  extraction: ExtractionResult;
  description: string;
  expectedStatus: 'compliant' | 'violation';
}> = [];

export const MOCK_HISTORY: InspectionRecord[] = [];

export const MOCK_CONSUMER_REPORTS: ConsumerReport[] = [];

export const REPEAT_VIOLATOR_HEATMAP: Array<{
  entity: string;
  location: string;
  violations: number;
  last_flagged: string;
  severity: string;
}> = [];
