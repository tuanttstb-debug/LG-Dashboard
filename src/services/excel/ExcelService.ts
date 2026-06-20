import ExcelJS from 'exceljs';
import type { Invoice } from '@/types';
import { formatDate } from '@/lib/utils';

class ExcelService {
  async generateInvoiceExcel(invoice: Invoice): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'LG Dashboard';
    wb.created = new Date();

    const ws = wb.addWorksheet('Invoice', {
      pageSetup: { paperSize: 9, orientation: 'portrait' },
    });

    this.styleWorksheet(ws, invoice);

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateBatchExcel(invoices: Invoice[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'LG Dashboard';
    wb.created = new Date();

    // Summary sheet
    const summary = wb.addWorksheet('Summary');
    this.buildSummarySheet(summary, invoices);

    // One sheet per invoice
    invoices.forEach((inv, idx) => {
      const ws = wb.addWorksheet(`Invoice ${idx + 1}`);
      this.styleWorksheet(ws, inv);
    });

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private styleWorksheet(ws: ExcelJS.Worksheet, invoice: Invoice): void {
    const brandBlue = '0F4C81';
    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: brandBlue },
    };
    const headerFont: Partial<ExcelJS.Font> = {
      bold: true,
      color: { argb: 'FFFFFF' },
      size: 11,
    };

    ws.columns = [
      { key: 'label', width: 28 },
      { key: 'value', width: 42 },
    ];

    const addHeader = (text: string) => {
      const row = ws.addRow([text]);
      row.getCell(1).fill = headerFill;
      row.getCell(1).font = headerFont;
      row.getCell(2).fill = headerFill;
      ws.mergeCells(row.number, 1, row.number, 2);
      row.height = 20;
    };

    const addRow = (label: string, value: string | number | null) => {
      const row = ws.addRow([label, value ?? '—']);
      row.getCell(1).font = { bold: true, color: { argb: '374151' } };
      row.getCell(1).fill = {
        type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' },
      };
    };

    // ── Invoice Header ────────────────────────────────────────────────────────
    addHeader('INVOICE DETAILS');
    addRow('Invoice Number', invoice.invoiceNumber);
    addRow('Invoice Date',   formatDate(invoice.invoiceDate));
    addRow('Courier',        invoice.courier.toUpperCase());
    addRow('Currency',       invoice.currency);
    ws.addRow([]);

    // ── Shipper ───────────────────────────────────────────────────────────────
    addHeader('SHIPPER');
    addRow('Name',        invoice.shipper?.name ?? null);
    addRow('Company',     invoice.shipper?.company ?? null);
    addRow('Address',     invoice.shipper?.address1 ?? null);
    addRow('City',        invoice.shipper?.city ?? null);
    addRow('Postal Code', invoice.shipper?.postalCode ?? null);
    addRow('Country',     invoice.shipper?.country ?? null);
    ws.addRow([]);

    // ── Consignee ─────────────────────────────────────────────────────────────
    addHeader('CONSIGNEE');
    addRow('Name',        invoice.consignee?.name ?? null);
    addRow('Company',     invoice.consignee?.company ?? null);
    addRow('Address',     invoice.consignee?.address1 ?? null);
    addRow('City',        invoice.consignee?.city ?? null);
    addRow('Postal Code', invoice.consignee?.postalCode ?? null);
    addRow('Country',     invoice.consignee?.country ?? null);
    ws.addRow([]);

    // ── Packages ──────────────────────────────────────────────────────────────
    addHeader('PACKAGES');
    if (invoice.packages.length > 0) {
      const pkgHeader = ws.addRow(['Tracking #', 'Weight', 'Unit', 'Service', 'Pieces']);
      pkgHeader.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DBEAFE' } };
      });
      invoice.packages.forEach((pkg) => {
        ws.addRow([
          pkg.trackingNumber,
          pkg.weight,
          pkg.weightUnit,
          pkg.serviceType ?? '—',
          pkg.pieces,
        ]);
      });
    }
    ws.addRow([]);

    // ── Charges ───────────────────────────────────────────────────────────────
    addHeader('CHARGES');
    const chargeHeader = ws.addRow(['Description', 'Amount', 'Type']);
    chargeHeader.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DBEAFE' } };
    });
    invoice.charges.forEach((charge) => {
      ws.addRow([charge.description, charge.amount, charge.type]);
    });

    // Total row
    const totalRow = ws.addRow(['TOTAL', invoice.totalCharge, invoice.currency]);
    totalRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: brandBlue } };
    });

    // Border all cells
    ws.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top:    { style: 'thin', color: { argb: 'E5E7EB' } },
          left:   { style: 'thin', color: { argb: 'E5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
          right:  { style: 'thin', color: { argb: 'E5E7EB' } },
        };
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
    });
  }

  private buildSummarySheet(ws: ExcelJS.Worksheet, invoices: Invoice[]): void {
    ws.columns = [
      { key: 'no',            width: 6,  header: '#' },
      { key: 'invoiceNumber', width: 20, header: 'Invoice #' },
      { key: 'invoiceDate',   width: 14, header: 'Date' },
      { key: 'courier',       width: 10, header: 'Courier' },
      { key: 'shipper',       width: 24, header: 'Shipper' },
      { key: 'consignee',     width: 24, header: 'Consignee' },
      { key: 'totalCharge',   width: 14, header: 'Total' },
      { key: 'currency',      width: 10, header: 'Currency' },
      { key: 'status',        width: 12, header: 'Status' },
    ];

    const header = ws.getRow(1);
    header.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F4C81' } };
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    });
    ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

    invoices.forEach((inv, idx) => {
      ws.addRow({
        no:            idx + 1,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate:   formatDate(inv.invoiceDate),
        courier:       inv.courier.toUpperCase(),
        shipper:       inv.shipper?.name ?? '—',
        consignee:     inv.consignee?.name ?? '—',
        totalCharge:   inv.totalCharge,
        currency:      inv.currency,
        status:        inv.status,
      });
    });
  }

  bufferToBase64(buffer: Buffer): string {
    return buffer.toString('base64');
  }

  triggerBrowserDownload(buffer: Buffer, fileName: string): void {
    const blob = new Blob([new Uint8Array(buffer)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const excelService = new ExcelService();
