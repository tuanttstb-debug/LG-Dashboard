# Project State — LG Dashboard

_Last updated: 2026-06-21_

## Identity

| Field | Value |
|---|---|
| Project | LG Dashboard — Logistics Invoice Management |
| Repo | `https://github.com/tuanttstb-debug/LG-Dashboard` |
| Live | `https://tuanttstb-debug.github.io/LG-Dashboard/` |
| Stack | Next.js 14.2.5 · TypeScript strict · Tailwind · Zustand · TanStack Query v5 |
| Backend | GAS Web App (Sheets + Drive as DB/storage) |
| AI | Gemini via `@google/generative-ai` SDK, client-side |
| Deploy | GitHub Pages (static export) via GitHub Actions |

## Architecture

```
Browser (GitHub Pages static SPA)
  ↓ AI extraction (default path)
Gemini API  ← direct browser call, key in NEXT_PUBLIC_GEMINI_API_KEY
  ↓ AI extraction (alternate path — NOT YET WIRED in frontend)
OCR Microservice (localhost:8000)  ← FastAPI + Tesseract 5.4.0, vie+eng
  ↓ save/load invoices
GAS Web App ← Content-Type: text/plain POST (avoids CORS preflight)
  ↓
Google Sheets (INVOICES / VERSIONS / METADATA)
Google Drive (PDF / Excel folders)
```

Key architectural choices:
- No server on main SPA — everything is client-side (GitHub Pages static export)
- No traditional DB — Google Sheets as storage
- OCR Adapter pattern: `GeminiOCRAdapter` (default active), `TesseractOCRAdapter` (stub — microservice exists but frontend adapter not yet written)
- Courier Strategy pattern: `FedExParser` (live), `DHLParser`/`UPSParser` (stubs)
- Dynamic route replaced by query param route for static export compat
- **NEW S3**: Tesseract OCR microservice deployed locally at `ocr-service/` — separate Python FastAPI process, not integrated into frontend yet

## Feature status

| Feature | Status |
|---|---|
| Upload PDF (drag & drop, queue, validation) | ✅ Built |
| AI extraction (OCR + courier parsing) | ✅ Built, model confirmed: `gemini-2.5-flash` |
| Invoice List (tabs, search, pagination) | ✅ Built |
| Review + Edit form (all sections) | ✅ Built |
| Save to GAS/Sheets | ✅ Built (untested end-to-end on production) |
| Export Excel (client-side ExcelJS) | ✅ Built |
| Upload to Google Drive | ✅ Built |
| Dashboard KPI | ✅ Built |
| PDF Viewer in review | ❌ Shows skeleton only — File not passed cross-page |
| History page | ❌ Placeholder only |
| Auth / multi-user | ❌ Out of scope V1 |
| OCR microservice (Tesseract) | ✅ Built + verified locally — NOT yet wired to frontend |
| `TesseractOCRAdapter.ts` in frontend | ❌ Stub only — throws "not implemented" |
| Project context docs (`docs/context/`) | ⏳ Structure designed, 26 files pending creation |

## Key files

```
src/config/index.ts              All env → config object (NEXT_PUBLIC_ prefix required)
src/adapters/ocr/               GeminiOCRAdapter (active), TesseractOCRAdapter (stub, throws)
src/adapters/courier/           FedExParser uses gemini-2.5-flash + JSON mode
src/services/ai/AIService.ts    orchestrates OCR → courier detect → parse
src/services/google/GASClient.ts text/plain POST with retry, secret auth
src/services/excel/ExcelService.ts client-side Excel gen + Drive upload
src/features/invoice/hooks/useFileUpload.ts  FileReader → base64 → aiService
src/features/invoice/hooks/useInvoices.ts    TanStack Query hooks for GAS
src/app/(dashboard)/invoices/review/ReviewClient.tsx  reads ?id= from searchParams
gas/src/Code.js                 GAS router: saveInvoice, getInvoices, uploadFile…

ocr-service/main.py             FastAPI entrypoint, CORS, /health
ocr-service/config.py           Settings (pydantic-settings, reads .env)
ocr-service/routers/ocr.py      POST /ocr/extract, POST /ocr/upload, GET /ocr/status/{job_id}
ocr-service/services/ocr_service.py  Tesseract wrapper, preprocess, confidence aggregation
ocr-service/services/pdf_service.py  PDF → PIL images via pypdfium2
ocr-service/tessdata/           eng.traineddata + vie.traineddata (tessdata_best)
```

## Env vars (all NEXT_PUBLIC_)

```
NEXT_PUBLIC_GEMINI_API_KEY          — AQ.Ab8... (53 chars, non-standard format, valid)
NEXT_PUBLIC_GEMINI_MODEL            — gemini-2.5-flash
NEXT_PUBLIC_GEMINI_FLASH_MODEL      — gemini-2.5-flash
NEXT_PUBLIC_GAS_WEB_APP_URL         — https://script.google.com/macros/s/.../exec
NEXT_PUBLIC_GAS_API_SECRET          — same value as Gemini key (user chose this)
NEXT_PUBLIC_GOOGLE_DRIVE_PDF_FOLDER_ID
NEXT_PUBLIC_GOOGLE_DRIVE_EXCEL_FOLDER_ID
NEXT_PUBLIC_GOOGLE_DRIVE_DETAIL_FOLDER_ID
NEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID
```

## GAS deployment

- Script URL: `https://script.google.com/macros/s/AKfycbxJfaPoUIMl-FpvpxKtUu02qDinMYdXEEEtp-6s6JA-3qQpW9vIhXjt3TK3GxM51nVsuQ/exec`
- Actions: ping, init, saveInvoice, saveInvoiceBatch, getInvoices, getInvoice, updateInvoice, saveVersion, getVersions, uploadFile, getFileUrl
- Secret verified on every request via `verifySecret(body.secret)`
- Sheets: INVOICES (17 cols), VERSIONS, METADATA
- Drive folders: PDF / Excel / Detail (IDs in env vars)
