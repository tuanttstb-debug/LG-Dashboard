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
      apiKey: opt('NEXT_PUBLIC_GEMINI_API_KEY', ''),
      model: opt('NEXT_PUBLIC_GEMINI_MODEL', 'gemini-1.5-pro'),
      flashModel: opt('NEXT_PUBLIC_GEMINI_FLASH_MODEL', 'gemini-1.5-flash'),
    },
    ocr: {
      engine: opt('NEXT_PUBLIC_OCR_ENGINE', 'gemini') as 'gemini' | 'tesseract',
      maxRetries: optInt('NEXT_PUBLIC_OCR_MAX_RETRIES', 3),
      timeoutMs: optInt('NEXT_PUBLIC_OCR_TIMEOUT_MS', 60000),
    },
  },
  gas: {
    webAppUrl: opt('NEXT_PUBLIC_GAS_WEB_APP_URL', ''),
    apiSecret: opt('NEXT_PUBLIC_GAS_API_SECRET', ''),
  },
  google: {
    drive: {
      pdfFolderId: opt('NEXT_PUBLIC_GOOGLE_DRIVE_PDF_FOLDER_ID', ''),
      excelFolderId: opt('NEXT_PUBLIC_GOOGLE_DRIVE_EXCEL_FOLDER_ID', ''),
      detailFolderId: opt('NEXT_PUBLIC_GOOGLE_DRIVE_DETAIL_FOLDER_ID', ''),
    },
    sheets: {
      spreadsheetId: opt('NEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID', ''),
      invoiceSheet: opt('NEXT_PUBLIC_GOOGLE_SHEETS_INVOICE_SHEET', 'INVOICES'),
      versionSheet: opt('NEXT_PUBLIC_GOOGLE_SHEETS_VERSION_SHEET', 'VERSIONS'),
      metadataSheet: opt('NEXT_PUBLIC_GOOGLE_SHEETS_METADATA_SHEET', 'METADATA'),
    },
  },
  courier: {
    default: opt('NEXT_PUBLIC_DEFAULT_COURIER', 'fedex'),
    supported: ['fedex', 'dhl', 'ups'] as const,
  },
} as const;

export type AppConfig = typeof config;
