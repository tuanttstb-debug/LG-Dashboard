'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, ChevronDown, ChevronUp, Save, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/common/Button';
import { FormField, FormSelect } from '@/components/forms/FormField';
import { invoiceReviewSchema, type InvoiceReviewForm } from '@/features/invoice/types/review';
import { COURIER_LABELS } from '@/constants/courier';
import { CHARGE_TYPES, COURIER_TYPES } from '@/types';
import type { CourierType } from '@/types';

interface InvoiceEditFormProps {
  defaultValues: Partial<InvoiceReviewForm>;
  onSave: (data: InvoiceReviewForm) => Promise<void>;
  onExport: (data: InvoiceReviewForm) => Promise<void>;
  isSaving?: boolean;
  isExporting?: boolean;
}

function SectionHeader({
  title,
  expanded,
  onToggle,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between py-2 text-left"
    >
      <span className="text-[13px] font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </span>
      {expanded ? (
        <ChevronUp className="h-4 w-4 text-gray-400" />
      ) : (
        <ChevronDown className="h-4 w-4 text-gray-400" />
      )}
    </button>
  );
}

function AddressSection({
  prefix,
  register,
  errors,
}: {
  prefix: 'shipper' | 'consignee';
  register: ReturnType<typeof useForm<InvoiceReviewForm>>['register'];
  errors: ReturnType<typeof useForm<InvoiceReviewForm>>['formState']['errors'];
}) {
  const e = errors[prefix];
  return (
    <div className="grid grid-cols-2 gap-3">
      <FormField
        label="Name"
        required
        error={e?.name?.message}
        {...register(`${prefix}.name`)}
      />
      <FormField
        label="Company"
        error={e?.company?.message}
        {...register(`${prefix}.company`)}
      />
      <FormField
        label="Address"
        required
        className="col-span-2"
        error={e?.address1?.message}
        {...register(`${prefix}.address1`)}
      />
      <FormField
        label="City"
        required
        error={e?.city?.message}
        {...register(`${prefix}.city`)}
      />
      <FormField
        label="Postal Code"
        required
        error={e?.postalCode?.message}
        {...register(`${prefix}.postalCode`)}
      />
      <FormField
        label="State / Province"
        error={e?.state?.message}
        {...register(`${prefix}.state`)}
      />
      <FormField
        label="Country"
        required
        error={e?.country?.message}
        {...register(`${prefix}.country`)}
      />
      <FormField
        label="Phone"
        error={e?.phone?.message}
        {...register(`${prefix}.phone`)}
      />
    </div>
  );
}

export function InvoiceEditForm({
  defaultValues,
  onSave,
  onExport,
  isSaving,
  isExporting,
}: InvoiceEditFormProps) {
  const [expanded, setExpanded] = useState({
    header: true,
    shipper: true,
    consignee: true,
    packages: true,
    charges: true,
  });

  const toggle = (key: keyof typeof expanded) =>
    setExpanded((s) => ({ ...s, [key]: !s[key] }));

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InvoiceReviewForm>({
    resolver: zodResolver(invoiceReviewSchema),
    defaultValues: defaultValues as InvoiceReviewForm,
  });

  const {
    fields: packageFields,
    append: appendPackage,
    remove: removePackage,
  } = useFieldArray({ control, name: 'packages' });

  const {
    fields: chargeFields,
    append: appendCharge,
    remove: removeCharge,
  } = useFieldArray({ control, name: 'charges' });

  const charges = watch('charges');
  const totalCalc = charges?.reduce((sum, c) => sum + (c.amount ?? 0), 0) ?? 0;

  return (
    <form className="flex flex-col gap-0 overflow-hidden">
      {/* Scrollable form body */}
      <div className="flex-1 overflow-auto space-y-0 divide-y divide-gray-100">

        {/* Header section */}
        <div className="px-5 py-4">
          <SectionHeader
            title="Invoice Header"
            expanded={expanded.header}
            onToggle={() => toggle('header')}
          />
          {expanded.header && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Controller
                name="courier"
                control={control}
                render={({ field }) => (
                  <FormSelect label="Courier" required error={errors.courier?.message} {...field}>
                    {COURIER_TYPES.map((c) => (
                      <option key={c} value={c}>
                        {COURIER_LABELS[c as CourierType]}
                      </option>
                    ))}
                  </FormSelect>
                )}
              />
              <FormField
                label="Invoice Number"
                required
                error={errors.invoiceNumber?.message}
                {...register('invoiceNumber')}
              />
              <FormField
                label="Invoice Date"
                type="date"
                required
                error={errors.invoiceDate?.message}
                {...register('invoiceDate')}
              />
              <FormField
                label="Currency"
                required
                error={errors.currency?.message}
                {...register('currency')}
              />
            </div>
          )}
        </div>

        {/* Shipper */}
        <div className="px-5 py-4">
          <SectionHeader
            title="Shipper"
            expanded={expanded.shipper}
            onToggle={() => toggle('shipper')}
          />
          {expanded.shipper && (
            <div className="mt-3">
              <AddressSection prefix="shipper" register={register} errors={errors} />
            </div>
          )}
        </div>

        {/* Consignee */}
        <div className="px-5 py-4">
          <SectionHeader
            title="Consignee"
            expanded={expanded.consignee}
            onToggle={() => toggle('consignee')}
          />
          {expanded.consignee && (
            <div className="mt-3">
              <AddressSection prefix="consignee" register={register} errors={errors} />
            </div>
          )}
        </div>

        {/* Packages */}
        <div className="px-5 py-4">
          <SectionHeader
            title="Packages"
            expanded={expanded.packages}
            onToggle={() => toggle('packages')}
          />
          {expanded.packages && (
            <div className="mt-3 space-y-3">
              {packageFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="relative rounded-input border border-gray-100 bg-gray-50 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-400">
                      Package {idx + 1}
                    </span>
                    {packageFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePackage(idx)}
                        className="text-gray-400 hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      label="Tracking #"
                      required
                      className="col-span-2"
                      error={errors.packages?.[idx]?.trackingNumber?.message}
                      {...register(`packages.${idx}.trackingNumber`)}
                    />
                    <FormField
                      label="Weight"
                      type="number"
                      step="0.01"
                      error={errors.packages?.[idx]?.weight?.message}
                      {...register(`packages.${idx}.weight`, { valueAsNumber: true })}
                    />
                    <Controller
                      name={`packages.${idx}.weightUnit`}
                      control={control}
                      render={({ field }) => (
                        <FormSelect label="Unit" {...field}>
                          <option value="kg">kg</option>
                          <option value="lb">lb</option>
                        </FormSelect>
                      )}
                    />
                    <FormField
                      label="Service Type"
                      error={errors.packages?.[idx]?.serviceType?.message}
                      {...register(`packages.${idx}.serviceType`)}
                    />
                    <FormField
                      label="Pieces"
                      type="number"
                      error={errors.packages?.[idx]?.pieces?.message}
                      {...register(`packages.${idx}.pieces`, { valueAsNumber: true })}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  appendPackage({
                    trackingNumber: '',
                    weight: 0,
                    weightUnit: 'kg',
                    dimensions: null,
                    serviceType: null,
                    pieces: 1,
                  })
                }
                className="flex w-full items-center justify-center gap-1.5 rounded-input border border-dashed border-gray-200 py-2 text-[12px] font-medium text-gray-400 transition-colors hover:border-brand hover:text-brand"
              >
                <Plus className="h-3.5 w-3.5" />
                Add package
              </button>
            </div>
          )}
        </div>

        {/* Charges */}
        <div className="px-5 py-4">
          <SectionHeader
            title="Charges"
            expanded={expanded.charges}
            onToggle={() => toggle('charges')}
          />
          {expanded.charges && (
            <div className="mt-3 space-y-2">
              {chargeFields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-[1fr_100px_100px_32px] items-end gap-2">
                  <FormField
                    label={idx === 0 ? 'Description' : ''}
                    error={errors.charges?.[idx]?.description?.message}
                    {...register(`charges.${idx}.description`)}
                  />
                  <FormField
                    label={idx === 0 ? 'Amount' : ''}
                    type="number"
                    step="0.01"
                    error={errors.charges?.[idx]?.amount?.message}
                    {...register(`charges.${idx}.amount`, { valueAsNumber: true })}
                  />
                  <Controller
                    name={`charges.${idx}.type`}
                    control={control}
                    render={({ field }) => (
                      <FormSelect label={idx === 0 ? 'Type' : ''} {...field}>
                        {CHARGE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </option>
                        ))}
                      </FormSelect>
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => removeCharge(idx)}
                    className={cn(
                      'mb-0.5 self-end rounded-input p-1.5 text-gray-400 transition-colors hover:text-danger',
                      idx === 0 && 'mt-5',
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  appendCharge({ description: '', amount: 0, currency: 'USD', type: 'other' })
                }
                className="flex w-full items-center justify-center gap-1.5 rounded-input border border-dashed border-gray-200 py-2 text-[12px] font-medium text-gray-400 transition-colors hover:border-brand hover:text-brand"
              >
                <Plus className="h-3.5 w-3.5" />
                Add charge
              </button>

              {/* Total */}
              <div className="flex items-center justify-end gap-2 rounded-input bg-gray-50 px-3 py-2">
                <span className="text-[12px] font-medium text-gray-500">Calculated Total:</span>
                <span className="text-[15px] font-bold text-gray-900">
                  {formatCurrency(totalCalc)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-white px-5 py-4">
        <Button
          type="button"
          variant="outline"
          size="md"
          loading={isSaving}
          onClick={handleSubmit(onSave)}
        >
          <Save className="h-4 w-4" />
          Save
        </Button>
        <Button
          type="button"
          variant="accent"
          size="md"
          loading={isExporting}
          onClick={handleSubmit(onExport)}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export Excel
        </Button>
      </div>
    </form>
  );
}
