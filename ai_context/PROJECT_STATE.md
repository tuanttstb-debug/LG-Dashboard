# Project State — LG Dashboard

_Last updated: 2026-06-21 (S5)_

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
| HEAD | `29a138e` (main) — GeminiDirect engine, layout fix, GAS persistence, review page fix |

## Architecture

```
Browser (GitHub Pages static SPA)
  ↓ AI extraction (active path — NEXT_PUBLIC_OCR_ENGINE=gemini-direct)
GeminiDirectAdapter  ← PDF as base64 inline + combined OCR+extraction prompt → structured JSON
  ↓ AI extraction (two-call path — engine=gemini)
GeminiOCRAdapter → raw text → FedExParser → structured JSON
  ↓ AI extraction (alternate path — engine=tesseract, NOT YET WIRED)
OCR Microservice (localhost:8000)  ← FastAPI + Tesseract 5.4.0, vie+eng
  ↓ save/load invoices (GAS persistence added S5)
GAS Web App ← Content-Type: text/plain POST (avoids CORS preflight)
  ↓
Google Sheets (INVOICES / VERSIONS / METADATA)
Google Drive (PDF / Excel folders)
```

Key architectural choices:
- No server on main SPA — everything is client-side (GitHub Pages static export)
- No traditional DB — Google Sheets as storage
- OCR Adapter pattern: `GeminiDirectAdapter` (active — 1 Gemini call, ~35-45s), `GeminiOCRAdapter` (2-call fallback), `TesseractOCRAdapter` (stub — microservice exists but adapter not yet implemented)
- `DirectExtractionAdapter` interface: type guard `isDirectAdapter()` short-circuits `AIService` to skip OCR+parse two-step
- Courier Strategy pattern: `FedExParser` (live), `DHLParser`/`UPSParser` (stubs); **bypassed entirely** in gemini-direct path
- Dynamic route replaced by query param route for static export compat
- GAS persistence: invoices auto-saved on upload via `Promise.allSettled` in `useFileUpload.ts`

## Feature status

| Feature | Status |
|---|---|
| Upload PDF (drag & drop, queue, validation) | ✅ Built |
| AI extraction (OCR + courier parsing) | ✅ Built — `gemini-direct` engine active (1-call PDF→JSON) |
| Invoice List (tabs, search, pagination) | ✅ Built |
| Review + Edit form (all sections) | ✅ Built |
| Save to GAS/Sheets on upload | ✅ Built (S5 — `Promise.allSettled` in `useFileUpload`) |
| Export Excel (client-side ExcelJS) | ✅ Built |
| Upload to Google Drive | ✅ Built |
| Dashboard KPI | ✅ Built |
| PDF Viewer in review | ❌ Shows skeleton only — File not passed cross-page |
| History page | ❌ Placeholder only |
| Auth / multi-user | ❌ Out of scope V1 |
| OCR microservice (Tesseract) | ✅ Built + verified locally — NOT yet wired to frontend |
| `TesseractOCRAdapter.ts` in frontend | ❌ Stub only — throws "not implemented" (low priority — gemini-direct is active) |
| `GeminiDirectAdapter.ts` | ✅ Built S5 — PDF inline + combined prompt, retry on 5xx/429 |
| Layout (sidebar overlap) | ✅ Fixed S5 — sidebar flex sibling, removed `fixed` + `pl-sidebar` |
| Review page blank after OCR | ✅ Fixed S5 — GAS save + `savedIds` nav + `!isError` render guard |
| Project context docs (`docs/context/`) | ⏳ Structure designed, 26 files pending creation |

## Key files

```
src/config/index.ts              All env → config object (NEXT_PUBLIC_ prefix required)
src/adapters/ocr/OCRAdapter.ts   BaseOCRAdapter, DirectExtractionAdapter interface, isDirectAdapter()
src/adapters/ocr/GeminiDirectAdapter.ts  NEW S5 — combined OCR+extraction in 1 Gemini call
src/adapters/ocr/GeminiOCRAdapter.ts    Two-call path (OCR text → parse)
src/adapters/ocr/TesseractOCRAdapter.ts Stub only — throws if activated
src/adapters/courier/           FedExParser uses gemini-2.5-flash + JSON mode (bypassed in gemini-direct)
src/services/ai/AIService.ts    isDirectAdapter() short-circuit → gemini-direct path
src/services/google/GASClient.ts text/plain POST with retry, secret auth
src/services/excel/ExcelService.ts client-side Excel gen + Drive upload
src/features/invoice/hooks/useFileUpload.ts  FileReader → base64 → aiService → buildFullInvoice → GAS save
src/features/invoice/types/upload.ts    UploadFile.savedIds: string[] (NEW S5)
src/features/invoice/hooks/useInvoices.ts    TanStack Query hooks for GAS
src/app/(dashboard)/invoices/upload/page.tsx handleReviewAll → ROUTES.review(firstSavedId)
src/app/(dashboard)/invoices/review/ReviewClient.tsx  !isLoading && !isError render guard
src/components/layout/Sidebar.tsx  flex shrink-0 (NOT fixed) — S5 layout fix
src/app/(dashboard)/layout.tsx     flex flex-1 overflow-hidden (no pl-sidebar) — S5 layout fix
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
