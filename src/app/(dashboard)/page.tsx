'use client';

import { Topbar } from '@/components/layout/Topbar';
import { Card, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { DataTable, type Column } from '@/components/table/DataTable';
import { useInvoiceList } from '@/features/invoice/hooks/useInvoices';
import { ROUTES } from '@/constants/routes';
import { COURIER_LABELS } from '@/constants/courier';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Invoice, CourierType } from '@/types';
import { FileText, Upload, Clock, CheckCircle, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const RECENT_COLUMNS: Column<Invoice>[] = [
  {
    key: 'invoiceNumber',
    header: 'Invoice #',
    render: (row) => <span className="font-medium text-gray-900">{row.invoiceNumber || '—'}</span>,
  },
  {
    key: 'courier',
    header: 'Courier',
    width: '90px',
    render: (row) => (
      <span className="font-medium text-brand">
        {COURIER_LABELS[row.courier as CourierType] ?? row.courier}
      </span>
    ),
  },
  {
    key: 'invoiceDate',
    header: 'Date',
    width: '110px',
    render: (row) => <span className="text-gray-500">{row.invoiceDate ? formatDate(row.invoiceDate) : '—'}</span>,
  },
  {
    key: 'totalCharge',
    header: 'Total',
    width: '110px',
    align: 'right',
    render: (row) => (
      <span className="font-medium">{formatCurrency(row.totalCharge, row.currency)}</span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    width: '110px',
    align: 'center',
    render: (row) => <Badge status={row.status} />,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading } = useInvoiceList(1, 5);

  const invoices = data?.items ?? [];
  const total    = data?.total ?? 0;

  const pending  = invoices.filter((i) => i.status === 'pending').length;
  const exported = invoices.filter((i) => i.status === 'exported').length;

  const KPI_CARDS = [
    {
      label: 'Total Invoices',
      value: total || '—',
      sub: 'All time',
      icon: FileText,
      color: 'text-brand bg-brand-100',
    },
    {
      label: 'Loaded',
      value: isLoading ? '…' : invoices.length,
      sub: 'This page',
      icon: Upload,
      color: 'text-accent bg-accent-100',
    },
    {
      label: 'Pending Review',
      value: isLoading ? '…' : pending,
      sub: 'Needs attention',
      icon: Clock,
      color: 'text-warning bg-warning-light',
    },
    {
      label: 'Exported',
      value: isLoading ? '…' : exported,
      sub: 'Excel generated',
      icon: CheckCircle,
      color: 'text-success bg-success-light',
    },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar
        title="Dashboard"
        actions={
          <Link href={ROUTES.upload}>
            <Button size="md">
              <Upload className="h-4 w-4" />
              Upload Invoice
            </Button>
          </Link>
        }
      />

      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4">
          {KPI_CARDS.map(({ label, value, sub, icon: Icon, color }) => (
            <Card key={label}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-medium text-gray-500">{label}</p>
                  <p className="mt-1 text-[28px] font-bold text-gray-900">{value}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>
                </div>
                <div className={`rounded-input p-2.5 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Recent Invoices */}
        <Card noPadding>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <CardTitle>Recent Invoices</CardTitle>
            <Link
              href={ROUTES.invoices}
              className="flex items-center gap-1 text-[13px] font-medium text-brand hover:underline"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <DataTable
            columns={RECENT_COLUMNS}
            data={invoices}
            rowKey={(row) => row.id}
            emptyMessage="No invoices yet — upload your first invoice to get started"
            onRowClick={(row) => router.push(ROUTES.review(row.id))}
            loading={isLoading}
          />
        </Card>
      </main>
    </div>
  );
}
