'use client';

import { FileText, X, RotateCcw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UploadFile } from '@/features/invoice/types/upload';
import { COURIER_LABELS } from '@/constants/courier';
import type { CourierType } from '@/types';

interface FileQueueItemProps {
  file: UploadFile;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onCourierChange: (id: string, courier: string | null) => void;
  disabled?: boolean;
}

const STATUS_CONFIG = {
  queued: { label: 'Queued', color: 'text-gray-500', bg: 'bg-gray-100' },
  uploading: { label: 'Uploading…', color: 'text-blue-600', bg: 'bg-blue-50' },
  processing: { label: 'AI Processing…', color: 'text-brand', bg: 'bg-brand-50' },
  done: { label: 'Done', color: 'text-success', bg: 'bg-success-light' },
  error: { label: 'Failed', color: 'text-danger', bg: 'bg-danger-light' },
} as const;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileQueueItem({
  file,
  onRemove,
  onRetry,
  onCourierChange,
  disabled,
}: FileQueueItemProps) {
  const cfg = STATUS_CONFIG[file.status];
  const isActive = file.status === 'uploading' || file.status === 'processing';
  const isDone = file.status === 'done';
  const isError = file.status === 'error';

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-input border bg-white p-4 transition-colors',
        isDone && 'border-success/30 bg-success-light/20',
        isError && 'border-danger/30 bg-danger-light/20',
        !isDone && !isError && 'border-gray-100',
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-input',
          cfg.bg,
        )}
      >
        {isActive ? (
          <Loader2 className={cn('h-5 w-5 animate-spin', cfg.color)} />
        ) : isDone ? (
          <CheckCircle className="h-5 w-5 text-success" />
        ) : isError ? (
          <AlertCircle className="h-5 w-5 text-danger" />
        ) : (
          <FileText className="h-5 w-5 text-gray-400" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-gray-800">{file.file.name}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className={cn('text-[11px] font-medium', cfg.color)}>{cfg.label}</span>
          <span className="text-[11px] text-gray-400">{formatBytes(file.file.size)}</span>
          {isDone && file.result && (
            <span className="text-[11px] text-success">
              {file.result.length} invoice{file.result.length !== 1 ? 's' : ''} extracted
            </span>
          )}
        </div>

        {/* Progress bar */}
        {isActive && (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}

        {/* Error message */}
        {isError && file.error && (
          <p className="mt-1 text-[11px] text-danger">{file.error}</p>
        )}
      </div>

      {/* Courier hint select */}
      {file.status === 'queued' && (
        <select
          value={file.courierHint ?? ''}
          onChange={(e) => onCourierChange(file.id, e.target.value || null)}
          disabled={disabled}
          className="h-8 rounded-input border border-gray-200 bg-white px-2 text-[12px] text-gray-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          aria-label="Courier hint"
        >
          <option value="">Auto-detect</option>
          {(Object.entries(COURIER_LABELS) as [CourierType, string][]).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      )}

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        {isError && (
          <button
            type="button"
            onClick={() => onRetry(file.id)}
            disabled={disabled}
            className="rounded-input p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-brand disabled:opacity-40"
            aria-label="Retry"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
        {!isActive && (
          <button
            type="button"
            onClick={() => onRemove(file.id)}
            disabled={disabled}
            className="rounded-input p-1.5 text-gray-400 transition-colors hover:bg-danger-light hover:text-danger disabled:opacity-40"
            aria-label="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
