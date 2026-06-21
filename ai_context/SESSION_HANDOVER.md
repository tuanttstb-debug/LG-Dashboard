# Session Handover — LG Dashboard

## Session: 2026-06-21 (S5)

### What was built this session

Full OCR pipeline completed end-to-end. Two critical UI bugs fixed. GeminiDirect engine (single-call PDF→JSON) added as default, replacing two-step OCR+parse flow. Invoices now persisted to GAS immediately after extraction.

---

### Tasks completed

| Task | Result |
|---|---|
| TesseractOCRAdapter implemented | `src/adapters/ocr/TesseractOCRAdapter.ts` — POSTs to ocr-service, returns OCRResult |
| Critical config bug fixed | `src/config/index.ts` fully rewritten — dynamic `process.env[key]` → static literals; this was root cause of ALL env var failures |
| FedExParser prompt updated | TYPE A (VND Freight Charge Notifications) and TYPE B (USD standard) — correctly extracts AWB as invoice number, VND charges |
| OCR microservice optimized | Single Tesseract pass per page (was double); DPI 200→150 option tested |
| GeminiDirectAdapter implemented | 1 Gemini call: PDF → structured JSON directly; 2-3× faster than 2-call path |
| `gemini-direct` engine wired | New engine type in config; `isDirectAdapter()` type guard; AIService short-circuits courier parser |
| Retry logic on 503/429 | GeminiDirectAdapter retries up to `maxRetries` times with 2s×attempt backoff |
| Bug fix: sidebar layout overlap | Sidebar was `fixed z-40` with `pl-sidebar` (undefined Tailwind class) → content hidden behind sidebar. Fixed: sidebar → flex sibling, `pl-sidebar` removed |
| Bug fix: blank page after OCR | Invoices only stored in state, never saved to GAS. Fixed: `useFileUpload` now saves all invoices to GAS via `Promise.allSettled` after extraction; `savedIds` stored per file |
| Bug fix: "Review Results" navigation | Was navigating to empty invoice list. Now navigates to first saved invoice review page |
| Bug fix: ReviewClient render logic | Form was rendering even when `isError=true` (showed empty form + error). Fixed: `!isLoading && !isError` guard; added "Back to list" button on error |
| TypeScript import fixed | Inline `import('./invoice').Invoice` in `ai.ts` → proper `import type { Invoice }` at file top |
| deploy.yml updated | `NEXT_PUBLIC_OCR_ENGINE: gemini` → `gemini-direct`; `OCR_TIMEOUT_MS` confirmed 60s |
| E2E verified locally | Full pipeline: upload → GeminiDirect extract (4 invoices, ~35-45s) → parallel GAS saves → "Review Results" visible → navigation works |

---

### Files changed this session

```
src/adapters/ocr/GeminiDirectAdapter.ts     NEW — combined OCR+extraction, single Gemini call, retry on 5xx
src/adapters/ocr/TesseractOCRAdapter.ts     NEW — POST to ocr-service, base64→Blob, AbortController timeout
src/adapters/ocr/OCRAdapter.ts              + DirectExtractionAdapter interface + isDirectAdapter() type guard
src/adapters/ocr/index.ts                   + GeminiDirectAdapter export + isDirectAdapter export
src/adapters/courier/FedExParser.ts         Prompt rewritten — TYPE A/B detection, VND handling, comma removal
src/config/index.ts                         REWRITTEN — all static literal env access; + 'gemini-direct' engine type
src/services/ai/AIService.ts                + gemini-direct case; direct extraction short-circuit path
src/types/ai.ts                             + DirectExtractionResult interface; proper import type
src/features/invoice/types/upload.ts        + savedIds?: string[]
src/features/invoice/hooks/useFileUpload.ts + sheetsService import; buildFullInvoice(); Promise.allSettled saves
src/app/(dashboard)/invoices/upload/page.tsx  handleReviewAll → navigate to first savedId review page
src/app/(dashboard)/invoices/review/ReviewClient.tsx  !isError guard on form; Back button on error
src/components/layout/Sidebar.tsx           removed fixed left-0 top-0 z-40; now flex sibling
src/app/(dashboard)/layout.tsx              removed pl-sidebar (was undefined Tailwind class)
ocr-service/services/ocr_service.py        single Tesseract pass (was double: image_to_data + image_to_string)
ocr-service/services/pdf_service.py        DPI default 300→200
.env.local                                  OCR_ENGINE=gemini-direct; TIMEOUT=60000
.github/workflows/deploy.yml               OCR_ENGINE gemini→gemini-direct
```

**Commits pushed:**
- `0edd775` — feat: GeminiDirect OCR engine (1-call PDF extraction)
- `11bca1e` — fix: TypeScript import type + deploy.yml engine update
- `29a138e` — fix: sidebar layout overlap + blank review page after OCR

---

### Decisions made

| Decision | Rationale |
|---|---|
| `gemini-direct` as default engine (not `gemini` or `tesseract`) | Single Gemini call: ~35s for 18-page PDF vs ~75s Tesseract; no local OCR service dependency at runtime |
| Tesseract kept as offline fallback | `OCR_ENGINE=tesseract` still works; microservice still running at `localhost:8000` |
| `Promise.allSettled` for GAS saves (not sequential) | Sequential 4×8s = 32s extra latency; parallel reduces to ~8s (max of all) |
| Save to GAS inside `useFileUpload` (not in upload page) | Keeps persistence logic co-located with extraction; upload page stays as presenter |
| `buildFullInvoice()` defaults `courier: 'fedex'` | Only FedEx parser supported; `courierHint` passed through but defaults gracefully |
| Sidebar: flex sibling, not `fixed` | Parent is already `h-screen overflow-hidden` — flex child is naturally full-height; avoids z-index/offset complexity |
| `!isLoading && !isError` on ReviewClient form | Prevents empty form rendering on error state — cleaner than separate error boundary |

---

### Blockers

1. **GAS saves taking 5-15s each** — `Promise.allSettled` with 4 invoices takes ~10-15s after extraction. Total time for 18-page FedEx PDF: ~50-60s. Under 10s not achievable for 16+ page documents without GPU or Cloud OCR. For typical 1-4 page invoices: ~8-12s total.

2. **`Promise.allSettled` can hang if GAS has no timeout** — `sheetsService.saveInvoice` uses fetch with no explicit timeout. If GAS is unreachable, `isProcessing` stays `true` indefinitely and "Review Results" never appears. Need fetch timeout in GASClient.

3. **PDF Viewer still shows skeleton** — `File` object not persisted cross-navigation. Carried from S2.

4. **E2E on GitHub Pages unverified** — GitHub Actions deploys on push to main; production URL `https://tuanttstb-debug.github.io/LG-Dashboard/` not manually verified this session.

---

### Regression risks

| Risk | Severity | Notes |
|---|---|---|
| `buildFullInvoice` defaults may corrupt data | MEDIUM | If Gemini returns `null` for required Address fields, they're set to `''` (empty string). Passes TypeScript but GAS saves empty strings to Sheets. |
| GAS `saveInvoice` called without `saveVersion` | MEDIUM | `useFileUpload` calls `sheetsService.saveInvoice` directly — skips the `saveVersion` call in `useSaveInvoice` mutation. Invoice versions not created on initial upload. |
| `gemini-direct` bypasses courier detection | LOW | No `detectCourier()` called — assumes Gemini correctly identifies invoice type. Non-FedEx PDFs will parse using FedEx prompt (may return garbage). |
| Sidebar `position: fixed` removed | LOW | Previously sticky on scroll — now sidebar scrolls WITH the page if content in sidebar overflows. Current sidebar height is always < viewport so no visible issue. |
| `OCR_TIMEOUT_MS` reduced 300000→60000 | LOW | 60s timeout now applies to `gemini-direct`. Very large PDFs (30+ pages) may timeout. Increase if needed. |

---

### State at session end

- Branch: `main`, HEAD `29a138e` (pushed to origin)
- Local dev: `http://localhost:3000/LG-Dashboard/`
- OCR engine active: `gemini-direct` (single Gemini call, ~35-45s for 18-page PDF)
- Tesseract service: `localhost:8000` — still running (can restart with `cd ocr-service && .\venv\Scripts\uvicorn.exe main:app --port 8000`)
- Layout: sidebar overlap bug fixed — verified via Playwright bounding box (sidebar x=0..252, main x=252)
- GAS saves: verified (4 parallel saves observed in network log during E2E)

---

## Session: 2026-06-21 (S4)

### What was built this session

Context audit → execution plan proposed → git push of all S3 artifacts to `origin/main`.

---

### Tasks completed

| Task | Result |
|---|---|
| Read ai_context files | SESSION_HANDOVER, PROJECT_STATE, TODO_NEXT read; `ARCHITECTURE_SUMMARY.md` confirmed missing |
| Project summary delivered | Current state, unfinished tasks, recent changes, prioritised execution plan |
| Git commit + push | `5be2da4` — 19 files, 617 insertions — `ocr-service/` + `ai_context/` pushed to origin |

---

### Files changed this session

- `ai_context/SESSION_HANDOVER.md` — S4 prepended
- `ai_context/PROJECT_STATE.md` — HEAD updated, ARCHITECTURE_SUMMARY gap noted
- `ai_context/TODO_NEXT.md` — ARCHITECTURE_SUMMARY gap noted, execution order confirmed
- `ai_context/TECH_DEBT.md` — S4 marker added to resolved table

**No changes to `src/`, `ocr-service/`, or `gas/`.**

---

### Decisions made

| Decision | Rationale |
|---|---|
| Execution order: TesseractOCRAdapter → PDF Viewer → E2E verify → History → Docs | User confirmed; adapter unblocks Tesseract path end-to-end |

---

### Blockers

1. **`TesseractOCRAdapter.ts` not implemented** — `AIService.ts:19` throws on engine `'tesseract'`. Next session starts here.
2. **E2E on GitHub Pages unverified** — Carried from S2/S3. No FedEx PDF tested on production URL.
3. **`ARCHITECTURE_SUMMARY.md` does not exist** — Referenced in ai_context file list but never created. Create standalone or as part of 26-doc system.

---

### Regression risks

None new — no source code modified this session.

---

### State at session end

- Branch: `main`, HEAD `5be2da4` (pushed to origin)
- `src/`: unchanged from `6e6895e`
- `ocr-service/`: committed and pushed — visible on GitHub
- Console encoding: UTF-8 (chcp 65001) set for this terminal session only
- Next: implement `src/adapters/ocr/TesseractOCRAdapter.ts`

---

## Session: 2026-06-21 (S3)

### What was built this session

Architecture audit → Tesseract installation → OCR microservice from scratch → Project context documentation system designed (pending confirmation to create files).

---

### Tasks completed

| Task | Result |
|---|---|
| Phase 1 Architecture Audit | Full report delivered — stack, layers, adapters, deploy model, dependency tree |
| Tesseract 5.4.0 installed | `winget install UB-Mannheim.TesseractOCR` → `C:\Program Files\Tesseract-OCR\` |
| Vietnamese tessdata downloaded | `tessdata_best/vie.traineddata` (12.4 MB) → `ocr-service/tessdata/vie.traineddata` |
| Python 3.12.10 installed | `py install 3.12` — required because Python 3.14 has no prebuilt wheels for Pillow/pydantic-core |
| OCR microservice built | `ocr-service/` — FastAPI + pytesseract + pypdfium2, Python 3.12 venv |
| All 3 endpoints verified live | `/health`, `POST /ocr/extract`, `POST /ocr/upload`, `GET /ocr/status/{job_id}` |
| 401 auth gate confirmed | Missing `x-api-secret` → `401 Invalid API secret` |
| Project context docs designed | 26 files proposed across `docs/context/`, `docs/adr/`, `docs/api/` — **awaiting user confirmation to create** |

---

### Files created this session

```
ocr-service/
├── main.py                        FastAPI app, CORS, /health, startup logger
├── config.py                      pydantic-settings — reads .env
├── requirements.txt               Pinned, Python 3.12 compatible
├── .env                           Active config (gitignored)
├── .env.example                   Template with all required vars
├── .gitignore
├── Dockerfile                     Linux target (apt tesseract-ocr-vie)
├── models/__init__.py
├── models/schemas.py              OCRResult, OCRUploadResponse, JobStatusResponse, HealthResponse
├── routers/__init__.py
├── routers/ocr.py                 POST /ocr/extract, POST /ocr/upload, GET /ocr/status/{job_id}
├── services/__init__.py
├── services/ocr_service.py        Tesseract wrapper, greyscale+sharpen preprocessing, per-page confidence
├── services/pdf_service.py        PDF → PIL via pypdfium2; raster → PIL
└── tessdata/
    ├── eng.traineddata            Copied from Tesseract install
    └── vie.traineddata            Downloaded tessdata_best (12.4 MB)
```

**No source code in `src/` was modified.**

---

### Decisions made

| Decision | Rationale |
|---|---|
| Native Tesseract binary (not tesseract.js WASM) | User explicitly requested microservice, not browser-based OCR |
| Python 3.12 venv, not Python 3.14 | Pillow 11 + pydantic-core 2.27 have no prebuilt wheels for 3.14 on Windows |
| Local `ocr-service/tessdata/` dir | No admin rights to write to `C:\Program Files\Tesseract-OCR\tessdata\`; `TESSDATA_PREFIX` env var used to redirect |
| `vie+eng` as default lang | Testing showed `vie+eng` at 88% confidence vs `eng`-only at 72.5% on same image |
| `pypdfium2` for PDF→image | Pure Python, no poppler binary required on Windows |
| In-memory `_job_store` for now | V1 — acceptable for single-user; async queue deferred to future |
| Dockerfile targets Linux | Production deploy on Linux container; dev uses local Windows Tesseract |
| docs/context/ system designed but not yet created | User requested audit + proposal first, then confirmation before file creation |

---

### Blockers

1. **Project context docs not created** — Proposal was accepted structurally but user has not yet confirmed to proceed with file creation. 26 files are ready to be written on next `confirm` signal.

2. **Frontend `TesseractOCRAdapter.ts` still throws** — `AIService.createAdapter()` case `'tesseract'` throws `'Tesseract adapter not yet implemented'`. OCR microservice exists but frontend is not yet connected to it. Phase 5 (API contract) and Phase 6 (integration) not started.

3. **End-to-end on GitHub Pages still unverified** — Carried over from S2. No FedEx PDF was available for live test during this session.

---

### Regression risks

| Risk | Severity | Notes |
|---|---|---|
| `ocr-service` runs on port 8000 — conflicts if already in use | MEDIUM | No port conflict check in startup. Use `--port` arg if needed |
| `_job_store` dict resets on uvicorn restart | LOW | Only affects `GET /ocr/status/{job_id}` across restarts — returns 404 for old jobs |
| `vie+eng` tessdata in git (12.4 MB binary) | LOW | Will slow `git clone`. Consider `.gitattributes` LFS if repo grows |
| Tesseract binary path hardcoded to Windows in `.env.example` | MEDIUM | Anyone cloning on Linux/Mac needs to override `TESSERACT_CMD` |
| Frontend unchanged — still uses Gemini as default OCR | INFO | `config.ai.ocr.engine = 'gemini'` by default. Tesseract path not yet wired |

---

### State at session end

- `ocr-service/` service: running at `http://localhost:8000`, verified
- Tesseract: `v5.4.0.20240606`, languages: `eng`, `vie`
- Python venv: `ocr-service/venv/` (Python 3.12.10, not committed)
- Main frontend: unchanged — `main` branch, HEAD `6e6895e`
- Context docs: proposal ready, **creation not yet started**
- To start OCR service: `cd ocr-service && .\venv\Scripts\uvicorn.exe main:app --reload --port 8000`

---

## Session: 2026-06-20 (S1 + S2 combined)

### What was built this session

Full project scaffold → GAS backend → Upload UI → Review screen → GitHub Pages static export. This was a **multi-phase build session** starting from zero.

---

### Tasks completed

| Phase | Commit | What |
|---|---|---|
| Foundation | `1b7f968` | Project scaffold: Next.js 14, Tailwind, shadcn/ui, all adapters, services, stores, types, layout, sidebar, topbar |
| Upload UI | `36bf0d4` | UploadZone, FileQueueItem, UploadQueue, useFileUpload hook |
| Review Screen | `c90514b` | InvoiceEditForm, PDFViewer, review page 45/55 split |
| GAS Backend | `37100ca` | Code.js, SheetsService.js, DriveService.js, Config.js deployed |
| Full wiring | `2cb9b9d` | DataTable, Pagination, useInvoices hooks, ExcelService, Dashboard KPI, Invoice List |
| Turbo fix | `3c56de6` | Remove `--turbo` from dev script (breaks webpack canvas alias) |
| Static export | `b64ff31` | GitHub Pages deployment architecture (see decisions below) |
| Model fix | `6e6895e` | Gemini model updated to `gemini-2.5-flash` |

---

### Files changed this session (S2 — GitHub Pages refactor)

```
next.config.mjs                                    output:export, basePath, trailingSlash, images
src/config/index.ts                                All env vars → NEXT_PUBLIC_ prefix
src/types/ai.ts                                    fileBuffer:Buffer → fileBase64:string
src/adapters/ocr/GeminiOCRAdapter.ts               Uses request.fileBase64 directly
src/services/google/GASClient.ts                   Content-Type: text/plain (CORS fix)
src/features/invoice/hooks/useFileUpload.ts        Calls aiService directly via FileReader (no /api route)
src/app/(dashboard)/invoices/review/page.tsx       NEW — non-dynamic route with Suspense wrapper
src/app/(dashboard)/invoices/review/ReviewClient.tsx  NEW — client component, reads id from useSearchParams
src/app/providers.tsx                              SpaRedirectHandler for GitHub Pages deep link
src/constants/routes.ts                            review(id) → /invoices/review?id=xxx
.github/workflows/deploy.yml                       NEW — GitHub Actions CI/CD to Pages
scripts/post-build.js                              NEW — replaces out/404.html with SPA redirect
package.json                                       postbuild script added
.env.example / .env.local                          All vars renamed to NEXT_PUBLIC_
```

**Deleted:**
- `src/app/api/ai/extract/route.ts` — incompatible with output:export
- `src/app/(dashboard)/invoices/[id]/review/` — replaced by non-dynamic route

---

### Decisions made

| Decision | Rationale |
|---|---|
| GitHub Pages static export | User chose this over Vercel/local |
| Route `/invoices/review?id=xxx` instead of `/invoices/[id]/review` | Next.js 14 `output:export` treats `generateStaticParams(){return[]}` as missing → build error. Query param route avoids dynamic route entirely |
| `Content-Type: text/plain` for GAS POST | `application/json` triggers CORS preflight; GAS has no `doOptions` handler. `text/plain` is a simple CORS request, no preflight needed. GAS doPost parses `e.postData.contents` regardless |
| AI extraction client-side (no API route) | API routes not supported in static export |
| `gemini-2.5-flash` for both OCR and parsing | `gemini-1.5-pro` → 403, `gemini-1.5-flash` → 404 model not found. `gemini-2.5-flash` confirmed working |
| `scripts/post-build.js` for 404.html | Next.js overwrites `public/404.html` during export; postbuild script replaces with SPA redirect after build |

---

### Blockers / open issues

1. **End-to-end not yet confirmed** — GitHub Actions deployed but Gemini model fix (`6e6895e`) may still be deploying at end of session. Need to verify upload → extract → review → save → export works fully on `https://tuanttstb-debug.github.io/LG-Dashboard/`

2. **PDF Viewer shows skeleton only** — Review page left panel always shows spinner. Uploaded File object is not persisted across navigation (upload page → review page). No regression from S1; was always a known gap.

3. **History page is placeholder** — `/history` renders empty page. Not implemented.

---

### Regression risks

| Risk | Severity | Notes |
|---|---|---|
| GAS CORS on production | HIGH | Changed to `text/plain` but untested end-to-end on GitHub Pages. If GAS rejects, save/load will fail silently |
| `useSearchParams` Suspense | MEDIUM | `ReviewClient` uses `useSearchParams()` wrapped in Suspense. If Suspense boundary missing or wrong, page may flash |
| `gemini-2.5-flash` + `responseMimeType:'application/json'` | MEDIUM | FedExParser uses JSON mode. Verify gemini-2.5-flash supports this generation config |
| SPA routing on page refresh | LOW | 404.html redirect → root → `SpaRedirectHandler` restores path. Not tested on production |

---

### State at session end

- Repo: `https://github.com/tuanttstb-debug/LG-Dashboard`
- Branch: `main`, HEAD `6e6895e`
- Live URL: `https://tuanttstb-debug.github.io/LG-Dashboard/`
- Local dev: `http://localhost:3001` (port 3000 occupied)
- GAS: deployed, ping OK, secret = same as `NEXT_PUBLIC_GAS_API_SECRET`
- Gemini key: `AQ.Ab8...` (53 chars) — valid, non-standard format, stored in `.env.local` and GitHub Secret `NEXT_PUBLIC_GEMINI_API_KEY`
