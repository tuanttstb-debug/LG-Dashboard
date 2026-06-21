# Session Handover — LG Dashboard

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
