import type { Invoice } from './invoice';

export type ExtractionStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export interface ExtractionError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ExtractionResult<T = unknown> {
  success: boolean;
  data?: T;
  rawText?: string;
  confidence?: number;
  error?: ExtractionError;
  processingTimeMs?: number;
}

export interface OCRResult {
  rawText: string;
  confidence?: number;
  pageCount: number;
  processingTimeMs: number;
}

export interface AIExtractionRequest {
  fileBase64: string;
  fileName: string;
  mimeType: string;
  courierHint?: string | null;
}

export interface FileUploadProgress {
  fileName: string;
  progress: number;
  status: ExtractionStatus;
  error?: string;
}

export interface DirectExtractionResult {
  invoices: Partial<Invoice>[];
  confidence: number;
  rawDescription: string;
  processingTimeMs: number;
}
