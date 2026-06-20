import { z } from 'zod';
import { CHARGE_TYPES, COURIER_TYPES } from '@/types';

const addressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().nullable(),
  address1: z.string().min(1, 'Address is required'),
  address2: z.string().nullable(),
  city: z.string().min(1, 'City is required'),
  state: z.string().nullable(),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().nullable(),
});

const packageSchema = z.object({
  trackingNumber: z.string().min(1, 'Tracking number is required'),
  weight: z.number().min(0),
  weightUnit: z.enum(['kg', 'lb']),
  dimensions: z
    .object({
      length: z.number().min(0),
      width: z.number().min(0),
      height: z.number().min(0),
      unit: z.enum(['cm', 'in']),
    })
    .nullable(),
  serviceType: z.string().nullable(),
  pieces: z.number().int().min(1),
});

const chargeSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0),
  currency: z.string().min(1),
  type: z.enum(CHARGE_TYPES),
});

export const invoiceReviewSchema = z.object({
  courier: z.enum(COURIER_TYPES),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  shipper: addressSchema,
  consignee: addressSchema,
  packages: z.array(packageSchema).min(1, 'At least one package is required'),
  charges: z.array(chargeSchema),
  totalCharge: z.number().min(0),
  currency: z.string().min(1),
});

export type InvoiceReviewForm = z.infer<typeof invoiceReviewSchema>;
