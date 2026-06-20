import type { CourierType, PackageInfo, Address } from './courier';

export const INVOICE_STATUSES = [
  'pending',
  'processing',
  'reviewed',
  'approved',
  'exported',
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const CHARGE_TYPES = ['freight', 'fuel', 'surcharge', 'tax', 'other'] as const;
export type ChargeType = (typeof CHARGE_TYPES)[number];

export interface InvoiceCharge {
  description: string;
  amount: number;
  currency: string;
  type: ChargeType;
}

export interface Invoice {
  id: string;
  courier: CourierType;
  invoiceNumber: string;
  invoiceDate: string;
  shipper: Address;
  consignee: Address;
  packages: PackageInfo[];
  charges: InvoiceCharge[];
  totalCharge: number;
  currency: string;
  status: InvoiceStatus;
  version: number;
  pdfUrl: string | null;
  excelUrl: string | null;
  extractedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceVersion {
  versionId: string;
  invoiceId: string;
  versionNo: number;
  snapshot: Invoice;
  createdAt: string;
}

export interface InvoiceBatch {
  batchId: string;
  invoices: Invoice[];
  totalCount: number;
  processedCount: number;
  failedCount: number;
  createdAt: string;
}

export type InvoiceDraft = Omit<Invoice, 'id' | 'version' | 'createdAt' | 'updatedAt'>;
