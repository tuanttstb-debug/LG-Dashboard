'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Invoice, InvoiceVersion, PaginatedResponse } from '@/types';
import { sheetsService } from '@/services/google/sheets/SheetsService';
import { generateId } from '@/lib/utils';

const INVOICE_KEYS = {
  all:     ['invoices'] as const,
  list:    (page: number, pageSize: number) => ['invoices', 'list', page, pageSize] as const,
  detail:  (id: string) => ['invoices', id] as const,
  versions:(id: string) => ['invoices', id, 'versions'] as const,
};

export function useInvoiceList(page = 1, pageSize = 20) {
  return useQuery<PaginatedResponse<Invoice>>({
    queryKey: INVOICE_KEYS.list(page, pageSize),
    queryFn:  () => sheetsService.getInvoices(page, pageSize),
    enabled:  true,
    placeholderData: (prev) => prev,
  });
}

export function useInvoice(id: string) {
  return useQuery<Invoice>({
    queryKey: INVOICE_KEYS.detail(id),
    queryFn:  () => sheetsService.getInvoiceById(id),
    enabled:  !!id,
  });
}

export function useInvoiceVersions(invoiceId: string) {
  return useQuery<InvoiceVersion[]>({
    queryKey: INVOICE_KEYS.versions(invoiceId),
    queryFn:  () => sheetsService.getVersions(invoiceId),
    enabled:  !!invoiceId,
  });
}

export function useSaveInvoice() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (invoice: Invoice) => {
      const saved = await sheetsService.saveInvoice(invoice);

      // Auto-create version snapshot
      await sheetsService.saveVersion({
        versionId:  generateId('ver'),
        invoiceId:  invoice.id,
        versionNo:  invoice.version,
        snapshot:   invoice,
        createdAt:  new Date().toISOString(),
      });

      return saved;
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: INVOICE_KEYS.all });
      qc.setQueryData(INVOICE_KEYS.detail(saved.id), saved);
      toast.success('Invoice saved');
    },
    onError: (err) => {
      toast.error('Save failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    },
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Invoice> }) =>
      sheetsService.updateInvoice(id, data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: INVOICE_KEYS.all });
      qc.setQueryData(INVOICE_KEYS.detail(updated.id), updated);
      toast.success('Invoice updated');
    },
    onError: (err) => {
      toast.error('Update failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    },
  });
}
