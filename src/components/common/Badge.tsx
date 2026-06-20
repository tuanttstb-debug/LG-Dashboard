import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';
import type { InvoiceStatus } from '@/types';

const badgeVariants = cva(
  'inline-flex items-center rounded-pill px-2.5 py-0.5 text-[11px] font-medium leading-none',
  {
    variants: {
      variant: {
        pending: 'bg-warning-light text-warning-dark',
        processing: 'bg-blue-100 text-blue-700',
        reviewed: 'bg-brand-100 text-brand-700',
        approved: 'bg-success-light text-success-dark',
        exported: 'bg-gray-100 text-gray-600',
        default: 'bg-gray-100 text-gray-600',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<'span' extends keyof HTMLElementTagNameMap ? HTMLSpanElement : never>,
    VariantProps<typeof badgeVariants> {
  status?: InvoiceStatus;
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  reviewed: 'Reviewed',
  approved: 'Approved',
  exported: 'Exported',
};

export function Badge({
  className,
  variant,
  status,
  children,
  ...props
}: BadgeProps & HTMLAttributes<HTMLSpanElement>) {
  const resolvedVariant = status ?? variant ?? 'default';

  return (
    <span
      className={cn(
        badgeVariants({ variant: resolvedVariant as VariantProps<typeof badgeVariants>['variant'] }),
        className,
      )}
      {...props}
    >
      {status ? STATUS_LABELS[status] : children}
    </span>
  );
}
