const opt = (key: string, fallback: string): string =>
  process.env[key] ?? fallback;

const optInt = (key: string, fallback: number): number => {
  const val = process.env[key];
  return val ? parseInt(val, 10) : fallback;
};

export const config = {
  app: {
    name: opt('NEXT_PUBLIC_APP_NAME', 'LG Dashboard'),
    url: opt('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
    env: opt('NODE_ENV', 'development'),
  },
  ai: {
    gemini: {
      apiKey: opt('GEMINI_API_KEY', ''),
      model: opt('GEMINI_MODEL', 'gemini-1.5-pro'),
      flashModel: opt('GEMINI_FLASH_MODEL', 'gemini-1.5-flash'),
    },
    ocr: {
      engine: opt('OCR_ENGINE', 'gemini') as 'gemini' | 'tesseract',
      maxRetries: optInt('OCR_MAX_RETRIES', 3),
      timeoutMs: optInt('OCR_TIMEOUT_MS', 60000),
    },
  },
  gas: {
    webAppUrl: opt('GAS_WEB_APP_URL', ''),
    apiSecret: opt('GAS_API_SECRET', ''),
  },
  google: {
    drive: {
      pdfFolderId: opt('GOOGLE_DRIVE_PDF_FOLDER_ID', ''),
      excelFolderId: opt('GOOGLE_DRIVE_EXCEL_FOLDER_ID', ''),
      detailFolderId: opt('GOOGLE_DRIVE_DETAIL_FOLDER_ID', ''),
    },
    sheets: {
      spreadsheetId: opt('GOOGLE_SHEETS_SPREADSHEET_ID', ''),
      invoiceSheet: opt('GOOGLE_SHEETS_INVOICE_SHEET', 'INVOICES'),
      versionSheet: opt('GOOGLE_SHEETS_VERSION_SHEET', 'VERSIONS'),
      metadataSheet: opt('GOOGLE_SHEETS_METADATA_SHEET', 'METADATA'),
    },
  },
  courier: {
    default: opt('DEFAULT_COURIER', 'fedex'),
    supported: ['fedex', 'dhl', 'ups'] as const,
  },
} as const;

export type AppConfig = typeof config;
