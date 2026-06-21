# TODO Next — LG Dashboard

_Last updated: 2026-06-21_

## P0 — Immediate (blocking everything else)

### Create project context documentation — `docs/context/` (15 files)
- **Status**: Structure designed, user confirmation received in S3
- **Action**: Create all 26 files across `docs/context/`, `docs/adr/`, `docs/api/`, `docs/roadmap/`, `docs/decision/`
- **Entry point**: `docs/context/15_context_index.md`

### Wire TesseractOCRAdapter to OCR microservice
- **File to create**: `src/adapters/ocr/TesseractOCRAdapter.ts`
- **What**: Implement `BaseOCRAdapter` — POST to `http://localhost:8000/ocr/extract`, return `OCRResult`
- **Config**: Add `NEXT_PUBLIC_OCR_SERVICE_URL` + `NEXT_PUBLIC_OCR_SERVICE_SECRET` to `src/config/index.ts` and `.env.local`
- **Switch**: Set `NEXT_PUBLIC_OCR_ENGINE=tesseract` to activate
- **Note**: Frontend currently throws on `tesseract` engine — `AIService.ts:19`

### Verify end-to-end on GitHub Pages (carried from S2)
- [ ] Open `https://tuanttstb-debug.github.io/LG-Dashboard/`
- [ ] Upload a FedEx PDF → confirm Gemini extraction returns data (no 403/404)
- [ ] Review extracted invoice → Save → confirm row appears in Google Sheets
- [ ] Export Excel → confirm download + Drive upload
- [ ] Navigate via sidebar links → confirm no broken routes
- [ ] Refresh on `/invoices/review?id=xxx` → confirm SPA redirect works

## P1 — Known gaps to implement

### PDF Viewer (Review page)
- **Problem**: The uploaded `File` object is lost during navigation from upload → review page
- **Fix**: Store the File in Zustand `invoiceStore` keyed by upload ID, read it in ReviewClient
- **Files**: `src/store/invoiceStore.ts`, `src/features/invoice/hooks/useFileUpload.ts`, `src/app/(dashboard)/invoices/review/ReviewClient.tsx`
- **Note**: PDFViewer component already built at `src/components/invoice/PDFViewer.tsx` — just needs to be wired

### History page
- **File**: `src/app/(dashboard)/history/page.tsx`
- **Scope**: List all saved invoice versions with date/user, allow viewing old snapshots
- **Data**: `getVersions` GAS action already implemented

## P2 — Quality / polish

- [ ] Add `loading.tsx` files for each route (skeleton states during navigation)
- [ ] Toast on GAS save success shows invoice number (currently generic)
- [ ] Invoice List: add date range filter
- [ ] Upload page: show batch summary after all files processed (total amount, courier breakdown)
- [ ] Review page: add "Approve" status transition button
- [ ] Dashboard KPI: calculate totals from ALL invoices (not just first page)

## P3 — Future (out of scope V1)

- Multi-user support (auth)
- DHL / UPS parser implementation (stubs exist at `src/adapters/courier/`)
- Batch export (all invoices in one Excel with summary sheet — `generateBatchExcel()` already built)
- Tesseract OCR as primary (microservice built in S3 — needs frontend wiring, see P0)
- Async OCR job queue (replace in-memory `_job_store` in `ocr-service/routers/ocr.py` with Redis or task queue)
- Docker Compose to run main app + ocr-service together in one command
