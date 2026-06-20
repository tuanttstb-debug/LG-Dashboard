import type { CourierType } from '@/types';

export const COURIER_LABELS: Record<CourierType, string> = {
  fedex: 'FedEx',
  dhl: 'DHL',
  ups: 'UPS',
};

export const COURIER_DETECTION_KEYWORDS: Record<CourierType, string[]> = {
  fedex: ['fedex', 'federal express', 'fdx'],
  dhl: ['dhl', 'deutsche post'],
  ups: ['ups', 'united parcel service'],
};
