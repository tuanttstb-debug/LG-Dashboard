import { BaseCourierParser } from './CourierParser';
import type { CourierParseResult } from './CourierParser';

export class UPSParser extends BaseCourierParser {
  readonly courierType = 'ups' as const;

  canParse(rawText: string): boolean {
    return /\bups\b|united parcel service/i.test(rawText);
  }

  async parse(_rawText: string): Promise<CourierParseResult> {
    throw new Error('UPS parser not yet implemented');
  }
}
