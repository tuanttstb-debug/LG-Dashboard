# TODO Next — LG Dashboard

_Last updated: 2026-06-20_

## P0 — Verify end-to-end (blocking everything else)

- [ ] Wait for GitHub Actions deploy of commit `6e6895e` to complete
- [ ] Open `https://tuanttstb-debug.github.io/LG-Dashboard/`
- [ ] Upload a FedEx PDF → confirm AI extraction returns data (no 403/404)
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
- Tesseract OCR fallback (`src/adapters/ocr/` stub exists)
