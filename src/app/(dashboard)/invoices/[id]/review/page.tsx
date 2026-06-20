'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/common/Button';
import { InvoiceEditForm } from '@/components/invoice/InvoiceEditForm';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import type { InvoiceReviewForm } from '@/features/invoice/types/review';

// react-pdf is client-side only — dynamic import with SSR disabled
const PDFViewer = dynamic(
  () => import('@/components/invoice/PDFViewer').then((m) => m.PDFViewer),
  { ssr: false, loading: () => <PDFViewerSkeleton /> },
);

function PDFViewerSkeleton() {
  return (
    <div className="flex h-full items-center justify-center rounded-card border border-gray-100 bg-gray-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
    </div>
  );
}

const MOCK_DEFAULT: Partial<InvoiceReviewForm> = {
  courier: 'fedex',
  invoiceNumber: '',
  invoiceDate: '',
  currency: 'USD',
  shipper: {
    name: '',
    company: null,
    address1: '',
    address2: null,
    city: '',
    state: null,
    postalCode: '',
    country: '',
    phone: null,
  },
  consignee: {
    name: '',
    company: null,
    address1: '',
    address2: null,
    city: '',
    state: null,
    postalCode: '',
    country: '',
    phone: null,
  },
  packages: [
    {
      trackingNumber: '',
      weight: 0,
      weightUnit: 'kg',
      dimensions: null,
      serviceType: null,
      pieces: 1,
    },
  ],
  charges: [],
  totalCharge: 0,
};

interface ReviewPageProps {
  params: { id: string };
}

export default function ReviewPage({ params }: ReviewPageProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Phase 2: load real data from store/query using params.id
  const pdfFile: File | null = null;

  const handleSave = async (_data: InvoiceReviewForm) => {
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      toast.success('Invoice saved successfully');
    } catch {
      toast.error('Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async (_data: InvoiceReviewForm) => {
    setIsExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success('Excel exported successfully');
    } catch {
      toast.error('Failed to export Excel');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar
        title={`Review Invoice`}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(ROUTES.invoices)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      {/* Side-by-side layout */}
      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* PDF Viewer — left 45% */}
        <div className="w-[45%] shrink-0 overflow-hidden border-r border-gray-100 p-4">
          {pdfFile ? (
            <PDFViewer file={pdfFile} className="h-full" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-card border-2 border-dashed border-gray-200 bg-gray-50">
              <p className="text-[14px] font-medium text-gray-400">PDF Preview</p>
              <p className="mt-1 text-[12px] text-gray-300">
                Available after upload — Invoice #{params.id}
              </p>
            </div>
          )}
        </div>

        {/* Invoice Edit Form — right 55% */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <InvoiceEditForm
            defaultValues={MOCK_DEFAULT}
            onSave={handleSave}
            onExport={handleExport}
            isSaving={isSaving}
            isExporting={isExporting}
          />
        </div>
      </div>
    </div>
  );
}
