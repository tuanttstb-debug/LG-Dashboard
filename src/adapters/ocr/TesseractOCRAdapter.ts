import { BaseOCRAdapter } from './OCRAdapter';
import type { OCRResult, AIExtractionRequest } from '@/types';
import { config } from '@/config';

export class TesseractOCRAdapter extends BaseOCRAdapter {
  readonly name = 'tesseract' as const;

  isAvailable(): boolean {
    return config.ocrService.url.length > 0;
  }

  async process(request: AIExtractionRequest): Promise<OCRResult> {
    const { result, timeMs } = await this.measureTime(() => this.callService(request));
    return result ?? { rawText: '', pageCount: 1, processingTimeMs: timeMs };
  }

  private async callService(request: AIExtractionRequest): Promise<OCRResult> {
    const blob = this.base64ToBlob(request.fileBase64, request.mimeType);
    const form = new FormData();
    form.append('file', blob, request.fileName);
    form.append('lang', 'vie+eng');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.ai.ocr.timeoutMs);

    let res: Response;
    try {
      res = await fetch(`${config.ocrService.url}/ocr/extract`, {
        method: 'POST',
        headers: { 'x-api-secret': config.ocrService.secret },
        body: form,
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error(`OCR service timed out after ${config.ai.ocr.timeoutMs / 1000}s — document may be too large`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText);
      throw new Error(`OCR service error ${res.status}: ${detail}`);
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error ?? 'OCR service returned failure');
    }

    return {
      rawText: data.raw_text,
      confidence: data.confidence,
      pageCount: data.pages,
      processingTimeMs: data.processing_time_ms,
    };
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteChars = atob(base64);
    const byteNums = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNums[i] = byteChars.charCodeAt(i);
    }
    return new Blob([byteNums], { type: mimeType });
  }
}
