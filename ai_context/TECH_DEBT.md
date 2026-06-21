# Tech Debt — LG Dashboard

_Last updated: 2026-06-21_

## Active debt

### TD-001 · GAS CORS — text/plain workaround
- **What**: `GASClient.ts` sends POST with `Content-Type: text/plain` because GAS doesn't handle OPTIONS preflight for `application/json`.
- **Risk**: If Google ever fixes GAS CORS properly, switching back to `application/json` is cleaner. Currently safe but non-standard.
- **File**: `src/services/google/GASClient.ts:59`

### TD-002 · Gemini key in client bundle
- **What**: `NEXT_PUBLIC_GEMINI_API_KEY` is embedded in the JS bundle at build time. Visible to anyone who inspects the source.
- **Risk**: API key abuse if repo/bundle is public. For V1 single-user this is acceptable. Mitigate: add API key restriction in Google Cloud Console (limit to `tuanttstb-debug.github.io` referrer).
- **Action needed**: User should go to Google Cloud Console → Credentials → restrict key to HTTP referrer `https://tuanttstb-debug.github.io/*`

### TD-003 · Gemini API key format unknown
- **What**: Key starts with `AQ.Ab8...` (53 chars). Non-standard vs typical `AIzaSy...` format. Works with `gemini-2.5-flash` only (`1.5-pro` → 403, `1.5-flash` → 404).
- **Risk**: If this key expires or access level changes, models may break. No fallback.
- **Action**: Document which Google Cloud project this key belongs to. If it stops working, get fresh key from `https://aistudio.google.com/apikey`.

### TD-004 · `useSearchParams()` instead of route params
- **What**: Review page uses `/invoices/review?id=xxx` + `useSearchParams()` instead of `/invoices/[id]/review` because static export can't handle dynamic routes without `generateStaticParams`.
- **Risk**: If migrating to Vercel later, the dynamic route pattern is better. Direct link sharing works but URL is less clean.
- **Reversibility**: Easy — create `[id]/review/page.tsx` with server wrapper, delete query-param route, update `ROUTES.review`.

### TD-005 · No optimistic updates on save
- **What**: `useSaveInvoice` calls GAS, waits for response, then shows toast. No optimistic UI.
- **Impact**: 1–3 second blank period after save button click.
- **Fix**: TanStack Query `onMutate` optimistic update pattern.

### TD-006 · `Buffer` polyfill dependency for ExcelService
- **What**: `ExcelService.ts` uses Node.js `Buffer` API (`Buffer.from()`, `buffer.toString('base64')`). Works in browser because Next.js/webpack provides a polyfill, but this is an implicit dependency.
- **Risk**: If webpack config changes or polyfill removed, client-side Excel gen breaks.
- **Fix**: Replace with browser-native `ArrayBuffer` + `TextEncoder` or use `btoa()`.

### TD-007 · SPA redirect via sessionStorage
- **What**: `public/404.html` → `sessionStorage.__spa_redirect` → `SpaRedirectHandler` in `providers.tsx`. Works but fragile: if user has sessionStorage disabled or clears it between 404 and root load, the path is lost.
- **Impact**: Low — single-user app, unlikely edge case.

### TD-008 · Dashboard KPI counts only first page
- **What**: Dashboard fetches `useInvoiceList(1, 5)` for KPIs. `total` is correct (from GAS), but `pending`/`exported` counts are calculated from the 5-item page only, not all invoices.
- **Fix**: Either add a dedicated GAS `getStats` action, or change to `useInvoiceList(1, 100)` for KPI calculation with a separate display query.

### TD-009 · OCR `_job_store` is in-memory
- **What**: `routers/ocr.py` stores job results in a module-level Python dict. Resets on every uvicorn restart.
- **Risk**: `GET /ocr/status/{job_id}` returns 404 for any job created before current server process started.
- **Impact**: Low — V1 single-user, `/ocr/extract` is synchronous so status endpoint is rarely needed.
- **Fix**: Replace with Redis, SQLite, or a simple file-based store when async processing is added.
- **File**: `ocr-service/routers/ocr.py:18`

### TD-010 · `ocr-service/venv/` not committed
- **What**: Python virtual environment is in `.gitignore`. Fresh clone requires `py -3.12 -m venv venv && pip install -r requirements.txt`.
- **Risk**: Onboarding friction. No setup script exists.
- **Fix**: Add `ocr-service/README.md` with setup instructions, or add `Makefile` / `setup.ps1` for one-command bootstrap.

### TD-011 · Tesseract path hardcoded for Windows in `.env.example`
- **What**: `TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe` is Windows-only. Linux/Mac paths differ (`/usr/bin/tesseract`).
- **Risk**: Any non-Windows developer or CI runner will need manual override.
- **Fix**: Add platform detection in `config.py` as fallback, or document per-OS override in README.

### TD-012 · Frontend `TesseractOCRAdapter.ts` still throws
- **What**: `AIService.createAdapter()` at `src/services/ai/AIService.ts:19` throws `Error('Tesseract adapter not yet implemented')` when `NEXT_PUBLIC_OCR_ENGINE=tesseract`.
- **Risk**: Setting the env var will break the entire upload pipeline immediately.
- **Fix**: Implement `TesseractOCRAdapter.ts` to POST to `ocr-service` — see TODO P0.
- **File**: `src/services/ai/AIService.ts:19`, `src/adapters/ocr/index.ts`

### TD-013 · `docs/architecture/overview.md` and `docs/flows/invoice-processing.md` are outdated
- **What**: Both files still reference the deleted `/api/ai/extract` route and the old server-side AI extraction pattern from before the static export refactor (S2).
- **Risk**: Misleads any developer reading docs — they describe an architecture that no longer exists.
- **Fix**: Will be superseded by `docs/context/03_architecture.md` and `docs/context/02_business_flow.md` once context doc creation is confirmed.
- **File**: `docs/architecture/overview.md`, `docs/flows/invoice-processing.md`

## Resolved this session

| Session | ID | What | How |
|---|---|---|---|
| S4 | — | No debt resolved — context audit + git push only | — |
| S1/S2 | — | `--turbo` breaks webpack canvas alias | Removed from `package.json` dev script |
| S1/S2 | — | `typedRoutes` type error | Removed `experimental.typedRoutes` from next.config.mjs |
| S1/S2 | — | `Buffer` not assignable to `BlobPart` | `new Uint8Array(buffer)` in `triggerBrowserDownload` |
| S1/S2 | — | API route incompatible with static export | Moved AI extraction to client-side, deleted route |
| S1/S2 | — | `[id]` dynamic route blocked static build | Replaced with query-param route `/invoices/review?id=` |
| S1/S2 | — | GAS CORS preflight blocked POST | Changed to `Content-Type: text/plain` |
| S1/S2 | — | `gemini-1.5-pro`/`flash` deprecated | Updated to `gemini-2.5-flash` |
| S1/S2 | — | `next.config.mjs` not supported | Renamed from `.ts`, converted to ESM |
