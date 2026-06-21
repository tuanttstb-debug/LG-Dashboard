import type { OCRResult, AIExtractionRequest, DirectExtractionResult } from '@/types';

export interface OCRAdapter {
  readonly name: string;
  process(request: AIExtractionRequest): Promise<OCRResult>;
  isAvailable(): boolean;
}

export interface DirectExtractionAdapter extends OCRAdapter {
  extractDirect(request: AIExtractionRequest): Promise<DirectExtractionResult>;
}

export function isDirectAdapter(adapter: OCRAdapter): adapter is DirectExtractionAdapter {
  return typeof (adapter as DirectExtractionAdapter).extractDirect === 'function';
}

export abstract class BaseOCRAdapter implements OCRAdapter {
  abstract readonly name: string;
  abstract process(request: AIExtractionRequest): Promise<OCRResult>;
  abstract isAvailable(): boolean;

  protected async measureTime<T>(
    fn: () => Promise<T>,
  ): Promise<{ result: T; timeMs: number }> {
    const start = Date.now();
    const result = await fn();
    return { result, timeMs: Date.now() - start };
  }
}
