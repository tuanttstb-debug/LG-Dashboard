// ─── Script Properties ───────────────────────────────────────────────────────
// Set these in GAS: Extensions → Apps Script → Project Settings → Script Properties
//
// Required properties:
//   API_SECRET          — shared secret with Next.js GAS_API_SECRET
//   SPREADSHEET_ID      — Google Spreadsheet ID
//   PDF_FOLDER_ID       — Drive folder for PDFs
//   EXCEL_FOLDER_ID     — Drive folder for Excel files
//   DETAIL_FOLDER_ID    — Drive folder for detail files

var PROPS = PropertiesService.getScriptProperties();

function getProp(key) {
  var value = PROPS.getProperty(key);
  if (!value) throw new Error('Missing Script Property: ' + key);
  return value;
}

function getPropOrDefault(key, defaultValue) {
  return PROPS.getProperty(key) || defaultValue;
}

// ─── Sheet names ─────────────────────────────────────────────────────────────
var INVOICE_SHEET  = 'INVOICES';
var VERSION_SHEET  = 'VERSIONS';
var METADATA_SHEET = 'METADATA';

// ─── Column definitions ───────────────────────────────────────────────────────
var INVOICE_HEADERS = [
  'id', 'courier', 'invoiceNumber', 'invoiceDate',
  'shipper', 'consignee', 'packages', 'charges',
  'totalCharge', 'currency', 'status', 'version',
  'pdfUrl', 'excelUrl', 'extractedAt', 'createdAt', 'updatedAt'
];

var VERSION_HEADERS = [
  'versionId', 'invoiceId', 'versionNo', 'snapshot', 'createdAt'
];

var METADATA_HEADERS = ['key', 'value', 'updatedAt'];

// Column index map for INVOICES (0-based)
var INV = {
  id: 0, courier: 1, invoiceNumber: 2, invoiceDate: 3,
  shipper: 4, consignee: 5, packages: 6, charges: 7,
  totalCharge: 8, currency: 9, status: 10, version: 11,
  pdfUrl: 12, excelUrl: 13, extractedAt: 14, createdAt: 15, updatedAt: 16
};

// Column index map for VERSIONS (0-based)
var VER = {
  versionId: 0, invoiceId: 1, versionNo: 2, snapshot: 3, createdAt: 4
};
