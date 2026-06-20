import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseOCRAdapter } from './OCRAdapter';
import type { OCRResult, AIExtractionRequest } from '@/types';
import { config } from '@/config';

export class GeminiOCRAdapter extends BaseOCRAdapter {
  readonly name = 'gemini' as const;
  private client: GoogleGenerativeAI;

  constructor() {
    super();
    this.client = new GoogleGenerativeAI(config.ai.gemini.apiKey);
  }

  isAvailable(): boolean {
    return config.ai.gemini.apiKey.length > 0;
  }

  async process(request: AIExtractionRequest): Promise<OCRResult> {
    const { result: rawText, timeMs } = await this.measureTime(() =>
      this.extractRawText(request),
    );

    return {
      rawText,
      pageCount: 1,
      processingTimeMs: timeMs,
    };
  }

  private async extractRawText(request: AIExtractionRequest): Promise<string> {
    const model = this.client.getGenerativeModel({ model: config.ai.gemini.model });

    const prompt = `Extract ALL text from this invoice document exactly as it appears.
Preserve labels, values, and layout structure. Do not summarize or interpret.
Output the raw text content only.`;

    const filePart = {
      inlineData: {
        data: request.fileBase64,
        mimeType: request.mimeType as 'application/pdf',
      },
    };

    const result = await model.generateContent([prompt, filePart]);
    return result.response.text();
  }
}
