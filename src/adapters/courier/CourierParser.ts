import type { Invoice, CourierType } from '@/types';

export interface CourierParseResult {
  invoices: Partial<Invoice>[];
  confidence: number;
  warnings: string[];
}

export interface CourierParser {
  readonly courierType: CourierType;
  parse(rawText: string): Promise<CourierParseResult>;
  canParse(rawText: string): boolean;
}

export abstract class BaseCourierParser implements CourierParser {
  abstract readonly courierType: CourierType;
  abstract parse(rawText: string): Promise<CourierParseResult>;
  abstract canParse(rawText: string): boolean;

  protected generateId(): string {
    return `${this.courierType}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }
}
