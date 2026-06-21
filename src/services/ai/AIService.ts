import type { Invoice, AIExtractionRequest, ExtractionResult } from '@/types';
import type { OCRAdapter } from '@/adapters/ocr/OCRAdapter';
import { isDirectAdapter } from '@/adapters/ocr/OCRAdapter';
import { GeminiOCRAdapter } from '@/adapters/ocr/GeminiOCRAdapter';
import { GeminiDirectAdapter } from '@/adapters/ocr/GeminiDirectAdapter';
import { TesseractOCRAdapter } from '@/adapters/ocr/TesseractOCRAdapter';
import { courierParserRegistry } from '@/adapters/courier';
import { config } from '@/config';

class AIService {
  private readonly ocrAdapter: OCRAdapter;

  constructor() {
    this.ocrAdapter = this.createAdapter();
  }

  private createAdapter(): OCRAdapter {
    switch (config.ai.ocr.engine) {
      case 'gemini':
        return new GeminiOCRAdapter();
      case 'gemini-direct':
        return new GeminiDirectAdapter();
      case 'tesseract':
        return new TesseractOCRAdapter();
    }
  }

  async extractFromPDF(
    request: AIExtractionRequest,
  ): Promise<ExtractionResult<Partial<Invoice>[]>> {
    const start = Date.now();

    try {
      // Single-call path: PDF → Gemini → structured JSON (no separate parser step)
      if (isDirectAdapter(this.ocrAdapter)) {
        const direct = await this.ocrAdapter.extractDirect(request);
        return {
          success: true,
          data: direct.invoices,
          rawText: direct.rawDescription,
          confidence: direct.confidence,
          processingTimeMs: Date.now() - start,
        };
      }

      // Two-call path: PDF → OCR → raw text → courier parser
      const ocrResult = await this.ocrAdapter.process(request);

      const courierType =
        request.courierHint != null
          ? (request.courierHint as Parameters<typeof courierParserRegistry.getParser>[0])
          : courierParserRegistry.detectCourier(ocrResult.rawText);

      if (!courierType) {
        return {
          success: false,
          rawText: ocrResult.rawText,
          error: {
            code: 'COURIER_NOT_DETECTED',
            message: 'Could not detect courier type from invoice content',
          },
          processingTimeMs: Date.now() - start,
        };
      }

      const parser = courierParserRegistry.getParser(courierType);
      const parseResult = await parser.parse(ocrResult.rawText);

      return {
        success: true,
        data: parseResult.invoices,
        rawText: ocrResult.rawText,
        confidence: parseResult.confidence,
        processingTimeMs: Date.now() - start,
      };
    } catch (err) {
      return {
        success: false,
        error: {
          code: 'EXTRACTION_FAILED',
          message: err instanceof Error ? err.message : 'Unknown extraction error',
          details: err,
        },
        processingTimeMs: Date.now() - start,
      };
    }
  }
}

export const aiService = new AIService();
