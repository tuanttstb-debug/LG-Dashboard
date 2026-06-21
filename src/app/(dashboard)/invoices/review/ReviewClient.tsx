'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { InvoiceEditForm } from '@/components/invoice/InvoiceEditForm';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useInvoice, useSaveInvoice } from '@/features/invoice/hooks/useInvoices';
import { driveService } from '@/services/google/drive/DriveService';
import type { InvoiceReviewForm } from '@/features/invoice/types/review';
import type { Invoice } from '@/types';

function PDFSkeleton() {
  return (
    <div className="flex h-full items-center justify-center rounded-card border border-gray-100 bg-gray-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
    </div>
  );
}

export function ReviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') ?? '';

  const [isExporting, setIsExporting] = useState(false);

  const { data: invoice, isLoading, isError } = useInvoice(id);
  const { mutateAsync: saveInvoice, isPending: isSaving } = useSaveInvoice();

  const buildInvoiceFromForm = (data: InvoiceReviewForm): Invoice => ({
    id,
    status:      invoice?.status ?? 'reviewed',
    version:     (invoice?.version ?? 0) + 1,
    pdfUrl:      invoice?.pdfUrl ?? null,
    excelUrl:    invoice?.excelUrl ?? null,
    extractedAt: invoice?.extractedAt ?? new Date().toISOString(),
    createdAt:   invoice?.createdAt   ?? new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
    ...data,
  });

  const handleSave = async (data: InvoiceReviewForm) => {
    const inv = buildInvoiceFromForm(data);
    await saveInvoice(inv);
  };

  const handleExport = async (data: InvoiceReviewForm) => {
    setIsExporting(true);
    try {
      const { excelService } = await import('@/services/excel/ExcelService');
      const inv = buildInvoiceFromForm({ ...data, status: 'exported' } as unknown as InvoiceReviewForm & { status: Invoice['status'] });

      const buffer = await excelService.generateInvoiceExcel({ ...inv, ...data } as Invoice);

      const fileName = `invoice-${data.invoiceNumber || id}.xlsx`;
      excelService.triggerBrowserDownload(buffer, fileName);

      const base64 = excelService.bufferToBase64(buffer);
      driveService.uploadExcel(base64, fileName)
        .then((result) => {
          const updatedInv = buildInvoiceFromForm(data);
          saveInvoice({ ...updatedInv, excelUrl: result.webViewLink, status: 'exported' })
            .catch(() => {/* non-critical */});
        })
        .catch(() => toast.warning('Excel generated but Drive upload failed'));

      toast.success('Excel exported successfully');
    } catch (err) {
      toast.error('Export failed: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setIsExporting(false);
    }
  };

  if (!id) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-500">
        No invoice selected.
      </div>
    );
  }

  const defaultValues = invoice
    ? {
        courier:       invoice.courier,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate:   invoice.invoiceDate,
        currency:      invoice.currency,
        shipper:       invoice.shipper,
        consignee:     invoice.consignee,
        packages:      invoice.packages.length > 0 ? invoice.packages : [
          { trackingNumber: '', weight: 0, weightUnit: 'kg' as const, dimensions: null, serviceType: null, pieces: 1 }
        ],
        charges:       invoice.charges,
        totalCharge:   invoice.totalCharge,
      }
    : {
        courier:       'fedex' as const,
        invoiceNumber: '',
        invoiceDate:   '',
        currency:      'USD',
        shipper:       { name: '', company: null, address1: '', address2: null, city: '', state: null, postalCode: '', country: '', phone: null },
        consignee:     { name: '', company: null, address1: '', address2: null, city: '', state: null, postalCode: '', country: '', phone: null },
        packages:      [{ trackingNumber: '', weight: 0, weightUnit: 'kg' as const, dimensions: null, serviceType: null, pieces: 1 }],
        charges:       [],
        totalCharge:   0,
      };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar
        title="Review Invoice"
        actions={
          <div className="flex items-center gap-3">
            {invoice && <Badge status={invoice.status} />}
            {invoice?.excelUrl && (
              <a
                href={invoice.excelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[13px] font-medium text-brand hover:underline"
              >
                View Excel <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(ROUTES.invoices)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        }
      />

      {isLoading && (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      )}

      {isError && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-danger">
          <p>Failed to load invoice. Check GAS connection.</p>
          <Button variant="ghost" size="sm" onClick={() => router.push(ROUTES.invoices)}>
            <ArrowLeft className="h-4 w-4" />
            Back to list
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="flex flex-1 gap-0 overflow-hidden">
          <div className="w-[45%] shrink-0 overflow-hidden border-r border-gray-100 p-4">
            <PDFSkeleton />
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <InvoiceEditForm
              defaultValues={defaultValues}
              onSave={handleSave}
              onExport={handleExport}
              isSaving={isSaving}
              isExporting={isExporting}
            />
          </div>
        </div>
      )}
    </div>
  );
}
