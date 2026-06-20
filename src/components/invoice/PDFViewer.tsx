'use client';

import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  file: File | string;
  className?: string;
}

export function PDFViewer({ file, className }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  }, []);

  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 2.0));
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.6));
  const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const nextPage = () => setCurrentPage((p) => Math.min(p + 1, numPages));

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-card border border-gray-100 bg-gray-50', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-2">
        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevPage}
            disabled={currentPage <= 1}
            className="rounded-input p-1 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[80px] text-center text-[12px] font-medium text-gray-600">
            {isLoading ? '…' : `${currentPage} / ${numPages}`}
          </span>
          <button
            type="button"
            onClick={nextPage}
            disabled={currentPage >= numPages}
            className="rounded-input p-1 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={zoomOut}
            disabled={scale <= 0.6}
            className="rounded-input p-1 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[44px] text-center text-[11px] text-gray-500">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={scale >= 2.0}
            className="rounded-input p-1 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading && (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand/40" />
          </div>
        )}
        <Document
          file={file}
          onLoadSuccess={onLoadSuccess}
          loading={null}
          className="flex justify-center"
        >
          <Page
            pageNumber={currentPage}
            scale={scale}
            className="shadow-card"
            renderTextLayer
            renderAnnotationLayer
          />
        </Document>
      </div>
    </div>
  );
}
