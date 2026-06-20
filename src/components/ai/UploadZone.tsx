'use client';

import { useCallback, useState, type DragEvent, type ChangeEvent } from 'react';
import { CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

export function UploadZone({ onFilesSelected, disabled, maxFiles = 20 }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;
      const { files } = e.dataTransfer;
      if (files.length > 0) onFilesSelected(files);
    },
    [disabled, onFilesSelected],
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target;
      if (files && files.length > 0) {
        onFilesSelected(files);
        e.target.value = '';
      }
    },
    [onFilesSelected],
  );

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-card border-2 border-dashed px-8 py-14 transition-all',
        isDragging
          ? 'border-brand bg-brand-50 scale-[1.01]'
          : 'border-gray-200 bg-gray-50 hover:border-brand/50 hover:bg-brand-50/40',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <input
        id="file-upload-input"
        type="file"
        accept="application/pdf"
        multiple
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={handleInputChange}
        disabled={disabled}
        aria-label="Upload PDF files"
      />

      <div
        className={cn(
          'mb-4 flex h-16 w-16 items-center justify-center rounded-card transition-colors',
          isDragging ? 'bg-brand text-white' : 'bg-brand-100 text-brand',
        )}
      >
        <CloudUpload className="h-8 w-8" />
      </div>

      <p className="text-[16px] font-semibold text-gray-800">
        {isDragging ? 'Drop your PDFs here' : 'Drag & drop invoices here'}
      </p>
      <p className="mt-1 text-[13px] text-gray-500">
        or{' '}
        <label
          htmlFor="file-upload-input"
          className="cursor-pointer font-medium text-brand hover:underline"
        >
          browse files
        </label>
      </p>

      <div className="mt-4 flex items-center gap-3">
        <span className="rounded-pill bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-500">
          PDF only
        </span>
        <span className="rounded-pill bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-500">
          Max 20MB per file
        </span>
        <span className="rounded-pill bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-500">
          Up to {maxFiles} files
        </span>
      </div>
    </div>
  );
}
