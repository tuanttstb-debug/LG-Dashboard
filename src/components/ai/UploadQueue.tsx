'use client';

import { FileQueueItem } from './FileQueueItem';
import type { UploadFile } from '@/features/invoice/types/upload';

interface UploadQueueProps {
  queue: UploadFile[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onCourierChange: (id: string, courier: string | null) => void;
  disabled?: boolean;
}

export function UploadQueue({
  queue,
  onRemove,
  onRetry,
  onCourierChange,
  disabled,
}: UploadQueueProps) {
  if (queue.length === 0) return null;

  return (
    <div className="space-y-2">
      {queue.map((file) => (
        <FileQueueItem
          key={file.id}
          file={file}
          onRemove={onRemove}
          onRetry={onRetry}
          onCourierChange={onCourierChange}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
