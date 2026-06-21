import type { Invoice } from '@/types';

export type FileUploadStatus = 'queued' | 'uploading' | 'processing' | 'done' | 'error';

export interface UploadFile {
  id: string;
  file: File;
  status: FileUploadStatus;
  progress: number;
  result?: Partial<Invoice>[];
  savedIds?: string[];
  error?: string;
  courierHint?: string | null;
}
