import { gasClient } from '../GASClient';
import type { Invoice, InvoiceVersion, PaginatedResponse } from '@/types';
import { config } from '@/config';

class SheetsService {
  async saveInvoice(invoice: Invoice): Promise<Invoice> {
    return gasClient.post<Invoice>('saveInvoice', {
      sheet: config.google.sheets.invoiceSheet,
      invoice,
    });
  }

  async saveInvoiceBatch(
    invoices: Invoice[],
  ): Promise<{ saved: number; failed: number }> {
    return gasClient.post('saveInvoiceBatch', {
      sheet: config.google.sheets.invoiceSheet,
      invoices,
    });
  }

  async getInvoices(page = 1, pageSize = 20): Promise<PaginatedResponse<Invoice>> {
    return gasClient.get('getInvoices', {
      sheet: config.google.sheets.invoiceSheet,
      page: String(page),
      pageSize: String(pageSize),
    });
  }

  async getInvoiceById(id: string): Promise<Invoice> {
    return gasClient.get('getInvoice', {
      sheet: config.google.sheets.invoiceSheet,
      id,
    });
  }

  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
    return gasClient.post<Invoice>('updateInvoice', {
      sheet: config.google.sheets.invoiceSheet,
      id,
      data,
    });
  }

  async saveVersion(version: InvoiceVersion): Promise<InvoiceVersion> {
    return gasClient.post<InvoiceVersion>('saveVersion', {
      sheet: config.google.sheets.versionSheet,
      version,
    });
  }

  async getVersions(invoiceId: string): Promise<InvoiceVersion[]> {
    return gasClient.get('getVersions', {
      sheet: config.google.sheets.versionSheet,
      invoiceId,
    });
  }
}

export const sheetsService = new SheetsService();
