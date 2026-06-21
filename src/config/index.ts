// Use static literal access for each NEXT_PUBLIC_* var — webpack can only replace
// process.env.NEXT_PUBLIC_FOO (dot notation literal), not process.env[variable].
export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME ?? 'LG Dashboard',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    env: process.env.NODE_ENV ?? 'development',
  },
  ai: {
    gemini: {
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? '',
      model: process.env.NEXT_PUBLIC_GEMINI_MODEL ?? 'gemini-1.5-pro',
      flashModel: process.env.NEXT_PUBLIC_GEMINI_FLASH_MODEL ?? 'gemini-1.5-flash',
    },
    ocr: {
      engine: (process.env.NEXT_PUBLIC_OCR_ENGINE ?? 'gemini') as 'gemini' | 'tesseract' | 'gemini-direct',
      maxRetries: parseInt(process.env.NEXT_PUBLIC_OCR_MAX_RETRIES ?? '3', 10),
      timeoutMs: parseInt(process.env.NEXT_PUBLIC_OCR_TIMEOUT_MS ?? '60000', 10),
    },
  },
  gas: {
    webAppUrl: process.env.NEXT_PUBLIC_GAS_WEB_APP_URL ?? '',
    apiSecret: process.env.NEXT_PUBLIC_GAS_API_SECRET ?? '',
  },
  google: {
    drive: {
      pdfFolderId: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_PDF_FOLDER_ID ?? '',
      excelFolderId: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_EXCEL_FOLDER_ID ?? '',
      detailFolderId: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_DETAIL_FOLDER_ID ?? '',
    },
    sheets: {
      spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID ?? '',
      invoiceSheet: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_INVOICE_SHEET ?? 'INVOICES',
      versionSheet: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_VERSION_SHEET ?? 'VERSIONS',
      metadataSheet: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_METADATA_SHEET ?? 'METADATA',
    },
  },
  courier: {
    default: process.env.NEXT_PUBLIC_DEFAULT_COURIER ?? 'fedex',
    supported: ['fedex', 'dhl', 'ups'] as const,
  },
  ocrService: {
    url: process.env.NEXT_PUBLIC_OCR_SERVICE_URL ?? 'http://localhost:8000',
    secret: process.env.NEXT_PUBLIC_OCR_SERVICE_SECRET ?? '',
  },
};

export type AppConfig = typeof config;
