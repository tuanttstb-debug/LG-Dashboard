import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseCourierParser } from './CourierParser';
import type { CourierParseResult } from './CourierParser';
import { config } from '@/config';

const EXTRACTION_PROMPT = `You are a FedEx invoice data extraction specialist.
Extract structured invoice data from the raw FedEx invoice text below.
Return ONLY valid JSON. If a field is missing, use null. Never guess values.

Return this JSON structure (one object per invoice found):
{
  "invoices": [
    {
      "invoiceNumber": "string | null",
      "invoiceDate": "YYYY-MM-DD | null",
      "shipper": {
        "name": "string | null",
        "company": "string | null",
        "address1": "string | null",
        "address2": "string | null",
        "city": "string | null",
        "state": "string | null",
        "postalCode": "string | null",
        "country": "string | null",
        "phone": "string | null"
      },
      "consignee": {
        "name": "string | null",
        "company": "string | null",
        "address1": "string | null",
        "address2": "string | null",
        "city": "string | null",
        "state": "string | null",
        "postalCode": "string | null",
        "country": "string | null",
        "phone": "string | null"
      },
      "packages": [
        {
          "trackingNumber": "string",
          "weight": 0.0,
          "weightUnit": "kg | lb",
          "dimensions": null,
          "serviceType": "string | null",
          "pieces": 1
        }
      ],
      "charges": [
        {
          "description": "string",
          "amount": 0.0,
          "currency": "USD",
          "type": "freight | fuel | surcharge | tax | other"
        }
      ],
      "totalCharge": 0.0,
      "currency": "USD"
    }
  ],
  "confidence": 0.95,
  "warnings": []
}`;

export class FedExParser extends BaseCourierParser {
  readonly courierType = 'fedex' as const;
  private client: GoogleGenerativeAI;

  constructor() {
    super();
    this.client = new GoogleGenerativeAI(config.ai.gemini.apiKey);
  }

  canParse(rawText: string): boolean {
    return /fedex|federal express|fdx/i.test(rawText);
  }

  async parse(rawText: string): Promise<CourierParseResult> {
    const model = this.client.getGenerativeModel({
      model: config.ai.gemini.flashModel,
      generationConfig: { responseMimeType: 'application/json' },
    });

    const result = await model.generateContent(
      `${EXTRACTION_PROMPT}\n\nRAW INVOICE TEXT:\n---\n${rawText}\n---`,
    );

    const jsonText = result.response.text();

    let parsed: CourierParseResult;
    try {
      parsed = JSON.parse(jsonText) as CourierParseResult;
    } catch {
      return {
        invoices: [],
        confidence: 0,
        warnings: ['Failed to parse Gemini JSON response'],
      };
    }

    return parsed;
  }
}
