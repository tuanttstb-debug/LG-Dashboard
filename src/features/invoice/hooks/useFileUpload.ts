'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { generateId } from '@/lib/utils';
import type { UploadFile } from '../types/upload';
import type { APIResponse, ExtractionResult, Invoice } from '@/types';

const MAX_FILES = 20;
const MAX_SIZE_MB = 20;

export function useFileUpload() {
  const [queue, setQueue] = useState<UploadFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const updateFile = useCallback(
    (id: string, patch: Partial<Omit<UploadFile, 'id' | 'file'>>) => {
      setQueue((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      );
    },
    [],
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const incoming = Array.from(files);

      const pdfs = incoming.filter((f) => f.type === 'application/pdf');
      if (pdfs.length !== incoming.length) {
        toast.warning('Only PDF files are accepted. Non-PDF files were ignored.');
      }

      const oversized = pdfs.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
      if (oversized.length > 0) {
        toast.error(`${oversized.length} file(s) exceed ${MAX_SIZE_MB}MB limit and were skipped.`);
      }

      const valid = pdfs
        .filter((f) => f.size <= MAX_SIZE_MB * 1024 * 1024)
        .slice(0, MAX_FILES - queue.length);

      if (queue.length + valid.length > MAX_FILES) {
        toast.warning(`Maximum ${MAX_FILES} files per batch.`);
      }

      const newItems: UploadFile[] = valid.map((file) => ({
        id: generateId('upload'),
        file,
        status: 'queued',
        progress: 0,
        courierHint: null,
      }));

      setQueue((prev) => [...prev, ...newItems]);
    },
    [queue.length],
  );

  const removeFile = useCallback((id: string) => {
    setQueue((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearQueue = useCallback(() => setQueue([]), []);

  const setCourierHint = useCallback((id: string, courier: string | null) => {
    updateFile(id, { courierHint: courier });
  }, [updateFile]);

  const processFile = useCallback(
    async (uploadFile: UploadFile): Promise<void> => {
      updateFile(uploadFile.id, { status: 'uploading', progress: 10 });

      const formData = new FormData();
      formData.append('file', uploadFile.file);
      if (uploadFile.courierHint) {
        formData.append('courierHint', uploadFile.courierHint);
      }

      try {
        updateFile(uploadFile.id, { progress: 40, status: 'processing' });

        const res = await fetch('/api/ai/extract', {
          method: 'POST',
          body: formData,
        });

        const json = (await res.json()) as APIResponse<ExtractionResult<Partial<Invoice>[]>>;

        if (!res.ok || !json.success) {
          throw new Error(json.error?.message ?? 'Extraction failed');
        }

        updateFile(uploadFile.id, {
          status: 'done',
          progress: 100,
          result: json.data?.data ?? [],
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        updateFile(uploadFile.id, { status: 'error', progress: 0, error: message });
        toast.error(`Failed: ${uploadFile.file.name} — ${message}`);
      }
    },
    [updateFile],
  );

  const processAll = useCallback(async () => {
    const pending = queue.filter((f) => f.status === 'queued');
    if (pending.length === 0) return;

    setIsProcessing(true);

    // Process sequentially to avoid Gemini rate limits
    for (const file of pending) {
      await processFile(file);
    }

    setIsProcessing(false);

    const doneCount = queue.filter((f) => f.status === 'done').length + pending.length;
    toast.success(`Processed ${doneCount} invoice(s) successfully.`);
  }, [queue, processFile]);

  const retryFile = useCallback(
    async (id: string) => {
      const file = queue.find((f) => f.id === id);
      if (!file) return;
      updateFile(id, { status: 'queued', progress: 0, error: undefined });
      await processFile({ ...file, status: 'queued' });
    },
    [queue, processFile, updateFile],
  );

  const stats = {
    total: queue.length,
    queued: queue.filter((f) => f.status === 'queued').length,
    done: queue.filter((f) => f.status === 'done').length,
    error: queue.filter((f) => f.status === 'error').length,
    processing: queue.filter((f) => ['uploading', 'processing'].includes(f.status as string)).length,
  };

  return {
    queue,
    isProcessing,
    stats,
    addFiles,
    removeFile,
    clearQueue,
    setCourierHint,
    processAll,
    retryFile,
  };
}
