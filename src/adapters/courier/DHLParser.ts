import { BaseCourierParser } from './CourierParser';
import type { CourierParseResult } from './CourierParser';

export class DHLParser extends BaseCourierParser {
  readonly courierType = 'dhl' as const;

  canParse(rawText: string): boolean {
    return /\bdhl\b|deutsche post/i.test(rawText);
  }

  async parse(_rawText: string): Promise<CourierParseResult> {
    throw new Error('DHL parser not yet implemented');
  }
}
