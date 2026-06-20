import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, required, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      <label className="text-[12px] font-medium text-gray-600">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      <input
        ref={ref}
        className={cn(
          'h-9 rounded-input border px-3 text-[13px] text-gray-900 transition-colors placeholder:text-gray-400',
          'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20',
          error
            ? 'border-danger bg-danger-light/20 focus:ring-danger/20'
            : 'border-gray-200 bg-white hover:border-gray-300',
          className,
        )}
        {...props}
      />
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  ),
);

FormField.displayName = 'FormField';

interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormSelect({
  label,
  error,
  required,
  className,
  children,
  ...props
}: FormSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[12px] font-medium text-gray-600">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      <select
        className={cn(
          'h-9 rounded-input border px-3 text-[13px] text-gray-900 transition-colors',
          'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20',
          error
            ? 'border-danger bg-danger-light/20'
            : 'border-gray-200 bg-white hover:border-gray-300',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}
