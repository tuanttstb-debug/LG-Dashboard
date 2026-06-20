# LG Dashboard — Architecture Overview

## Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14 (App Router) | Frontend + API Routes |
| Language | TypeScript (strict) | Type safety |
| Styling | Tailwind CSS | Design system |
| Components | shadcn/ui (Radix UI) | Headless components |
| State | Zustand | Client state |
| Data Fetching | TanStack Query v5 | Server state + cache |
| Forms | React Hook Form + Zod | Validation |
| AI | Gemini API (google/generative-ai) | OCR + Extraction |
| Backend | Google Apps Script (Web App) | CRUD proxy |
| Database | Google Sheets | Invoice + version storage |
| Storage | Google Drive | PDF + Excel files |
| Excel | ExcelJS | Generate Excel reports |

## Layer Diagram

```
Browser (React / Next.js)
        │
        ├── /api/ai/extract  ──► AIService ──► OCRAdapter ──► Gemini API
        │                                          │
        │                              CourierParserRegistry
        │                                  FedExParser (Gemini)
        │
        └── GASClient (fetch) ──► GAS Web App ──► Google Sheets
                                              └──► Google Drive
```

## Key Design Decisions

### OCR Adapter Pattern
Business logic never calls Gemini directly.
All AI calls go through `OCRAdapter` interface → swappable engine.

### Courier Strategy Pattern
Each courier (FedEx, DHL, UPS) has its own `CourierParser`.
`CourierParserRegistry` selects parser by detection or hint.
Business layer stays courier-agnostic.

### GAS as API proxy
GAS Web App acts as the only interface to Google Sheets + Drive.
Frontend uses `GASClient` with retry logic.
When GAS is not configured, services throw `GASClientError`.

### Version tracking
Every Invoice save creates a `InvoiceVersion` record in the VERSIONS sheet.
Snapshots are stored as JSON string in the snapshot column.
