'use client';

import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/common/Button';
import { Card, CardHeader, CardTitle } from '@/components/common/Card';
import { UploadZone } from '@/components/ai/UploadZone';
import { UploadQueue } from '@/components/ai/UploadQueue';
import { useFileUpload } from '@/features/invoice/hooks/useFileUpload';
import { ROUTES } from '@/constants/routes';
import {
  Upload,
  Trash2,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const {
    queue,
    isProcessing,
    stats,
    addFiles,
    removeFile,
    clearQueue,
    setCourierHint,
    processAll,
    retryFile,
  } = useFileUpload();

  const hasQueue = queue.length > 0;
  const allDone = stats.done > 0 && stats.queued === 0 && !isProcessing;
  const hasErrors = stats.error > 0;

  const handleReviewAll = () => {
    const firstId = queue.find((f) => f.savedIds?.length)?.savedIds?.[0];
    router.push(firstId ? ROUTES.review(firstId) : ROUTES.invoices);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar
        title="Upload Invoices"
        actions={
          hasQueue ? (
            <div className="flex items-center gap-2">
              {!isProcessing && !allDone && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearQueue}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear all
                </Button>
              )}
              {allDone ? (
                <Button size="md" onClick={handleReviewAll}>
                  <CheckCircle className="h-4 w-4" />
                  Review Results
                </Button>
              ) : (
                <Button
                  size="md"
                  onClick={processAll}
                  loading={isProcessing}
                  disabled={stats.queued === 0}
                >
                  <Zap className="h-4 w-4" />
                  {isProcessing
                    ? 'Processing…'
                    : `Extract ${stats.queued} Invoice${stats.queued !== 1 ? 's' : ''}`}
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats bar — only when queue has items */}
        {hasQueue && (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total', value: stats.total, icon: Upload, color: 'text-brand bg-brand-100' },
              { label: 'Queued', value: stats.queued, icon: Clock, color: 'text-gray-500 bg-gray-100' },
              { label: 'Done', value: stats.done, icon: CheckCircle, color: 'text-success bg-success-light' },
              { label: 'Failed', value: stats.error, icon: AlertCircle, color: 'text-danger bg-danger-light' },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="py-4 px-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
                    <p className="mt-0.5 text-[24px] font-bold text-gray-900">{value}</p>
                  </div>
                  <div className={`rounded-input p-2 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Drop zone */}
        <Card noPadding className="p-6">
          <UploadZone
            onFilesSelected={addFiles}
            disabled={isProcessing}
            maxFiles={20}
          />
        </Card>

        {/* Queue */}
        {hasQueue && (
          <Card>
            <CardHeader>
              <CardTitle>
                Queue{' '}
                <span className="ml-1 text-[14px] font-normal text-gray-400">
                  ({stats.total} file{stats.total !== 1 ? 's' : ''})
                </span>
              </CardTitle>
              {hasErrors && !isProcessing && (
                <span className="text-[13px] text-danger">
                  {stats.error} file{stats.error !== 1 ? 's' : ''} failed
                </span>
              )}
            </CardHeader>

            <UploadQueue
              queue={queue}
              onRemove={removeFile}
              onRetry={retryFile}
              onCourierChange={setCourierHint}
              disabled={isProcessing}
            />

            {/* Extract button at bottom when queue is long */}
            {queue.length > 3 && !allDone && (
              <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
                <Button
                  size="md"
                  onClick={processAll}
                  loading={isProcessing}
                  disabled={stats.queued === 0}
                >
                  <Zap className="h-4 w-4" />
                  {isProcessing
                    ? 'Processing…'
                    : `Extract ${stats.queued} Invoice${stats.queued !== 1 ? 's' : ''}`}
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Success state */}
        {allDone && (
          <Card className="border-success/30 bg-success-light/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-gray-900">
                    All invoices processed
                  </p>
                  <p className="text-[13px] text-gray-500">
                    {stats.done} invoice{stats.done !== 1 ? 's' : ''} ready for review
                    {stats.error > 0 && ` · ${stats.error} failed`}
                  </p>
                </div>
              </div>
              <Button size="md" onClick={handleReviewAll}>
                <CheckCircle className="h-4 w-4" />
                Review Results
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
