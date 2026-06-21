import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseOCRAdapter, type DirectExtractionAdapter } from './OCRAdapter';
import type { OCRResult, AIExtractionRequest, DirectExtractionResult } from '@/types';
import { config } from '@/config';

// Combined OCR + structured extraction prompt (single Gemini call)
const DIRECT_PROMPT = `You are a logistics invoice extraction specialist for a Vietnamese freight forwarding company.
Extract ALL structured invoice data directly from this PDF document. Return ONLY valid JSON — no markdown, no explanation.

## Document types (check in this priority order)

### TYPE A — FedEx Freight Charge Notification (Vietnamese, charges in VND)
Identified by header: "FREIGHT CHARGE NOTIFICATIONS"
- invoiceNumber  = the AWB number (e.g. "382085402744")
- invoiceDate    = Ship Date field (YYYY-MM-DD)
- shipper.company = Shipper field value
- shipper.country = Origin field value (2-letter code → full name if possible)
- consignee.company = Consignee field value
- consignee.address1 = first line of Address
- consignee.address2 = second line of Address (if any)
- packages[0].trackingNumber = AWB number
- packages[0].weight = Gross Weight (number only, strip "KG")
- packages[0].weightUnit = "kg"
- packages[0].serviceType = service type from AWB label ("INTL ECONOMY", "INTL PRIORITY", etc.) or null
- packages[0].pieces = 1
- charges: extract each line as a charge object:
    "Freight Charge" → type "freight"
    "VAT"           → type "tax"
    "Fuel Surcharge"→ type "fuel"
    other lines     → type "other"
- totalCharge = Total Amount (number, remove commas: "679,584.00" → 679584)
- currency = "VND"

### TYPE B — Standard FedEx commercial invoice (USD)
Identified by: invoice number + invoice date fields in English table format
- invoiceNumber = Invoice number field
- invoiceDate   = Invoice date (YYYY-MM-DD)
- Extract shipper, consignee, packages, charges as shown in the JSON schema below
- currency = "USD" (or whatever currency appears)

## Rules
- Parse ONE invoice per "FREIGHT CHARGE NOTIFICATIONS" section found in the document
- Remove thousand-separator commas from numbers before returning: "645,624.00" → 645624.0
- Convert all dates to YYYY-MM-DD regardless of input format ("17 Jun 2026" → "2026-06-17")
- Use null for any field not found in the document — never guess
- Ignore duplicate pages (the same page may appear twice in the PDF)
- confidence: 0.0–1.0 reflecting your certainty about the extracted data

## JSON schema
{
  "invoices": [
    {
      "invoiceNumber": "string | null",
      "invoiceDate": "YYYY-MM-DD | null",
      "shipper": {
        "name": null,
        "company": "string | null",
        "address1": "string | null",
        "address2": "string | null",
        "city": "string | null",
        "state": null,
        "postalCode": "string | null",
        "country": "string | null",
        "phone": "string | null"
      },
      "consignee": {
        "name": null,
        "company": "string | null",
        "address1": "string | null",
        "address2": "string | null",
        "city": "string | null",
        "state": null,
        "postalCode": "string | null",
        "country": "string | null",
        "phone": "string | null"
      },
      "packages": [
        {
          "trackingNumber": "string",
          "weight": 0.0,
          "weightUnit": "kg",
          "dimensions": null,
          "serviceType": "string | null",
          "pieces": 1
        }
      ],
      "charges": [
        {
          "description": "string",
          "amount": 0.0,
          "currency": "VND",
          "type": "freight | fuel | surcharge | tax | other"
        }
      ],
      "totalCharge": 0.0,
      "currency": "VND"
    }
  ],
  "confidence": 0.9,
  "warnings": []
}`;

export class GeminiDirectAdapter extends BaseOCRAdapter implements DirectExtractionAdapter {
  readonly name = 'gemini-direct' as const;
  private client: GoogleGenerativeAI;

  constructor() {
    super();
    this.client = new GoogleGenerativeAI(config.ai.gemini.apiKey);
  }

  isAvailable(): boolean {
    return config.ai.gemini.apiKey.length > 0;
  }

  async process(request: AIExtractionRequest): Promise<OCRResult> {
    // Fallback: extract raw text (used only if direct path is bypassed)
    const model = this.client.getGenerativeModel({ model: config.ai.gemini.flashModel });
    const start = Date.now();
    const result = await model.generateContent([
      'Extract ALL text from this document exactly as it appears.',
      { inlineData: { data: request.fileBase64, mimeType: request.mimeType as 'application/pdf' } },
    ]);
    return { rawText: result.response.text(), pageCount: 1, processingTimeMs: Date.now() - start };
  }

  async extractDirect(request: AIExtractionRequest): Promise<DirectExtractionResult> {
    const start = Date.now();
    const model = this.client.getGenerativeModel({
      model: config.ai.gemini.flashModel,
      generationConfig: { responseMimeType: 'application/json' },
    });

    const filePart = {
      inlineData: { data: request.fileBase64, mimeType: request.mimeType as 'application/pdf' },
    };

    const maxRetries = config.ai.ocr.maxRetries;
    let lastErr: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 2000 * attempt));
      try {
        const result = await model.generateContent([DIRECT_PROMPT, filePart]);
        const jsonText = result.response.text();

        let parsed: { invoices?: DirectExtractionResult['invoices']; confidence?: number };
        try {
          parsed = JSON.parse(jsonText) as typeof parsed;
        } catch {
          return {
            invoices: [],
            confidence: 0,
            rawDescription: jsonText.slice(0, 500),
            processingTimeMs: Date.now() - start,
          };
        }

        return {
          invoices: parsed.invoices ?? [],
          confidence: parsed.confidence ?? 0,
          rawDescription: `GeminiDirect: ${parsed.invoices?.length ?? 0} invoice(s) extracted`,
          processingTimeMs: Date.now() - start,
        };
      } catch (err) {
        lastErr = err;
        const msg = err instanceof Error ? err.message : String(err);
        // Retry on transient server errors (503, 429, 500)
        if (!/503|502|429|500/.test(msg)) throw err;
      }
    }

    throw lastErr;
  }
}
