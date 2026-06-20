import type { OCRResult, AIExtractionRequest } from '@/types';

export interface OCRAdapter {
  readonly name: string;
  process(request: AIExtractionRequest): Promise<OCRResult>;
  isAvailable(): boolean;
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
