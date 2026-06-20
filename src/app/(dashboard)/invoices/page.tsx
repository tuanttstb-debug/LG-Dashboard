import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Upload, FileText } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = { title: 'Invoices' };

export default function InvoicesPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar
        title="Invoices"
        actions={
          <Link href={ROUTES.upload}>
            <Button size="md">
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </Link>
        }
      />

      <main className="flex-1 overflow-auto p-6">
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-[15px] font-medium text-gray-500">No invoices found</p>
            <p className="mt-1 text-[13px] text-gray-400">
              Invoices will appear here after upload and AI extraction
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
