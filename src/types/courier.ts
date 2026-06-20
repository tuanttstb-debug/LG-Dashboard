export const COURIER_TYPES = ['fedex', 'dhl', 'ups'] as const;
export type CourierType = (typeof COURIER_TYPES)[number];

export interface Address {
  name: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
}

export interface PackageInfo {
  trackingNumber: string;
  weight: number;
  weightUnit: 'kg' | 'lb';
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  } | null;
  serviceType: string | null;
  pieces: number;
}
