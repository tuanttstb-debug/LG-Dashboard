import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/common/Card';
import { Upload } from 'lucide-react';

export const metadata: Metadata = { title: 'Upload Invoices' };

export default function UploadPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar title="Upload Invoices" />

      <main className="flex-1 overflow-auto p-6">
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Upload className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-[15px] font-medium text-gray-500">Upload coming soon</p>
            <p className="mt-1 text-[13px] text-gray-400">
              PDF upload and AI extraction — Phase 2
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
