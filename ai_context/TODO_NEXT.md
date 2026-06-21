# TODO Next — LG Dashboard

_Last updated: 2026-06-21 (S5)_

## P0 — Immediate (blocking everything else)

> **Confirmed execution order (S5):** GAS timeout guard → saveVersion on upload → PDF Viewer → E2E verify → History page → Docs

### Add fetch timeout to GAS saveInvoice
- **Problem**: `sheetsService.saveInvoice()` in `useFileUpload.ts` has no timeout. If GAS is unreachable, `processFile` hangs indefinitely — `isProcessing` never resets, "Review Results" button never appears.
- **Fix**: Add `AbortController` with ~15s timeout in `GASClient.ts` request method, or wrap in `Promise.race` with timeout in `useFileUpload`.
- **File**: `src/services/google/GASClient.ts`
- **Risk**: High — confirmed production blocker if GAS deployment is slow or down

### saveVersion on initial upload
- **Problem**: `buildFullInvoice()` in `useFileUpload.ts` calls `sheetsService.saveInvoice()` directly, bypassing `useSaveInvoice` mutation which also calls `saveVersion`. Invoice version history starts empty — first snapshot only created on first edit+save from Review page.
- **Fix**: After `sheetsService.saveInvoice(inv)` succeeds, call `sheetsService.saveVersion(inv)` to record the initial extracted snapshot.
- **File**: `src/features/invoice/hooks/useFileUpload.ts:140`

### Create `ai_context/ARCHITECTURE_SUMMARY.md`
- **Status**: File does not exist — was referenced in context file list but never created (confirmed missing S4)
- **Action**: Create standalone file covering stack layers, adapter pattern, deploy model, data flow
- **Can do as part of the 26-doc system or as a one-off** — either is acceptable

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
- Wire `TesseractOCRAdapter` to OCR microservice (microservice built S3, pushed S4; adapter stub throws — low priority since `gemini-direct` is active and faster)
- Add DHL/UPS detection to `gemini-direct` path (currently all PDFs processed with FedEx-specific prompt regardless of `detectCourier()`)
- Async OCR job queue (replace in-memory `_job_store` in `ocr-service/routers/ocr.py` with Redis or task queue)
- Docker Compose to run main app + ocr-service together in one command
