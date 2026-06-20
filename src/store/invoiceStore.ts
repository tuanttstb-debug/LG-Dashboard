'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Invoice, InvoiceBatch, ExtractionStatus } from '@/types';

interface InvoiceStore {
  currentBatch: InvoiceBatch | null;
  selectedInvoice: Invoice | null;
  extractionStatus: ExtractionStatus;
  editedInvoices: Record<string, Partial<Invoice>>;

  setCurrentBatch: (batch: InvoiceBatch | null) => void;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  setExtractionStatus: (status: ExtractionStatus) => void;
  updateInvoiceEdit: (id: string, data: Partial<Invoice>) => void;
  clearEdits: () => void;
}

export const useInvoiceStore = create<InvoiceStore>()(
  devtools(
    (set) => ({
      currentBatch: null,
      selectedInvoice: null,
      extractionStatus: 'idle',
      editedInvoices: {},

      setCurrentBatch: (batch) => set({ currentBatch: batch }, false, 'setCurrentBatch'),
      setSelectedInvoice: (invoice) =>
        set({ selectedInvoice: invoice }, false, 'setSelectedInvoice'),
      setExtractionStatus: (status) =>
        set({ extractionStatus: status }, false, 'setExtractionStatus'),
      updateInvoiceEdit: (id, data) =>
        set(
          (state) => ({
            editedInvoices: {
              ...state.editedInvoices,
              [id]: { ...state.editedInvoices[id], ...data },
            },
          }),
          false,
          'updateInvoiceEdit',
        ),
      clearEdits: () => set({ editedInvoices: {} }, false, 'clearEdits'),
    }),
    { name: 'InvoiceStore' },
  ),
);
