# Invoice Processing Flow

## Sequence

```
User                  Frontend              API Route             Gemini              GAS/Sheets/Drive
 │                       │                     │                    │                      │
 │  Select PDF(s)        │                     │                    │                      │
 ├──────────────────────►│                     │                    │                      │
 │                       │  POST /api/ai/      │                    │                      │
 │                       │  extract (formData) │                    │                      │
 │                       ├────────────────────►│                    │                      │
 │                       │                     │  OCR: PDF→text     │                      │
 │                       │                     ├───────────────────►│                      │
 │                       │                     │◄───────────────────┤                      │
 │                       │                     │  Parse: text→JSON  │                      │
 │                       │                     ├───────────────────►│                      │
 │                       │                     │◄───────────────────┤                      │
 │                       │◄────────────────────┤                    │                      │
 │  Review Screen        │                     │                    │                      │
 │◄──────────────────────┤                     │                    │                      │
 │  Edit data            │                     │                    │                      │
 ├──────────────────────►│                     │                    │                      │
 │  Confirm & Export     │                     │                    │                      │
 ├──────────────────────►│                     │                    │                      │
 │                       │  concurrent:        │                    │                      │
 │                       ├─────────────────────┼────────────────────┼─────────────────────►│ saveInvoice
 │                       ├─────────────────────┼────────────────────┼─────────────────────►│ uploadPDF
 │                       │  generateExcel()    │                    │                      │
 │                       ├─────────────────────┼────────────────────┼─────────────────────►│ uploadExcel
 │  Download Excel       │                     │                    │                      │
 │◄──────────────────────┤                     │                    │                      │
```

## Error States

| Stage | Error | Recovery |
|---|---|---|
| Upload | File > 20MB | Reject, show message |
| OCR | Gemini timeout | Retry (3x), show error |
| Courier detection | Not detected | Manual courier select |
| JSON parse | Gemini bad output | Show raw text, manual entry |
| GAS save | Network error | Retry (3x), queue for retry |
