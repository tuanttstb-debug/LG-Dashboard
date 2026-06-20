# Session Handover — LG Dashboard

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
