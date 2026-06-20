import type { CourierParser } from './CourierParser';
import type { CourierType } from '@/types';
import { FedExParser } from './FedExParser';
import { DHLParser } from './DHLParser';
import { UPSParser } from './UPSParser';

class CourierParserRegistry {
  private readonly parsers = new Map<CourierType, CourierParser>();

  constructor() {
    this.register(new FedExParser());
    this.register(new DHLParser());
    this.register(new UPSParser());
  }

  register(parser: CourierParser): void {
    this.parsers.set(parser.courierType, parser);
  }

  getParser(courierType: CourierType): CourierParser {
    const parser = this.parsers.get(courierType);
    if (!parser) throw new Error(`No parser registered for courier: ${courierType}`);
    return parser;
  }

  detectCourier(rawText: string): CourierType | null {
    for (const [type, parser] of this.parsers) {
      if (parser.canParse(rawText)) return type;
    }
    return null;
  }

  getSupportedCouriers(): CourierType[] {
    return Array.from(this.parsers.keys());
  }
}

export const courierParserRegistry = new CourierParserRegistry();

export { FedExParser, DHLParser, UPSParser };
export type { CourierParser, CourierParseResult } from './CourierParser';
