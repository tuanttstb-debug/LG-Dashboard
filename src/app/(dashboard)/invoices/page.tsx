'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { DataTable, type Column } from '@/components/table/DataTable';
import { Pagination } from '@/components/table/Pagination';
import { useInvoiceList } from '@/features/invoice/hooks/useInvoices';
import { ROUTES } from '@/constants/routes';
import { COURIER_LABELS } from '@/constants/courier';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Invoice, InvoiceStatus, CourierType } from '@/types';
import { Upload, Search } from 'lucide-react';
import Link from 'next/link';

const PAGE_SIZE = 20;

const STATUS_TABS: { label: string; value: InvoiceStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Reviewed', value: 'reviewed' },
  { label: 'Approved', value: 'approved' },
  { label: 'Exported', value: 'exported' },
];

const COLUMNS: Column<Invoice>[] = [
  {
    key: 'invoiceNumber',
    header: 'Invoice #',
    width: '180px',
    render: (row) => (
      <span className="font-medium text-gray-900">{row.invoiceNumber || '—'}</span>
    ),
  },
  {
    key: 'courier',
    header: 'Courier',
    width: '100px',
    render: (row) => (
      <span className="font-medium text-brand">
        {COURIER_LABELS[row.courier as CourierType] ?? row.courier.toUpperCase()}
      </span>
    ),
  },
  {
    key: 'invoiceDate',
    header: 'Date',
    width: '120px',
    render: (row) => (
      <span className="text-gray-600">{row.invoiceDate ? formatDate(row.invoiceDate) : '—'}</span>
    ),
  },
  {
    key: 'shipper',
    header: 'Shipper',
    render: (row) => (
      <span className="truncate text-gray-700">{row.shipper?.name ?? '—'}</span>
    ),
  },
  {
    key: 'consignee',
    header: 'Consignee',
    render: (row) => (
      <span className="truncate text-gray-700">{row.consignee?.name ?? '—'}</span>
    ),
  },
  {
    key: 'totalCharge',
    header: 'Total',
    width: '120px',
    align: 'right',
    render: (row) => (
      <span className="font-medium text-gray-900">
        {formatCurrency(row.totalCharge, row.currency)}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    width: '120px',
    align: 'center',
    render: (row) => <Badge status={row.status} />,
  },
  {
    key: 'version',
    header: 'Ver.',
    width: '60px',
    align: 'center',
    render: (row) => (
      <span className="text-[12px] text-gray-400">v{row.version}</span>
    ),
  },
];

export default function InvoicesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [activeStatus, setActiveStatus] = useState<InvoiceStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useInvoiceList(page, PAGE_SIZE);

  const invoices = data?.items ?? [];
  const filtered = search.trim()
    ? invoices.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
          inv.shipper?.name?.toLowerCase().includes(search.toLowerCase()) ||
          inv.consignee?.name?.toLowerCase().includes(search.toLowerCase()),
      )
    : invoices;

  const handleRowClick = (invoice: Invoice) => {
    router.push(ROUTES.review(invoice.id));
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar
        title="Invoices"
        actions={
          <Link href={ROUTES.upload}>
            <Button size="md">
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </Link>
        }
      />

      <main className="flex-1 overflow-auto p-6 space-y-4">
        {/* Status tabs */}
        <div className="flex items-center gap-1 border-b border-gray-100 pb-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => { setActiveStatus(tab.value); setPage(1); }}
              className={`px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-px ${
                activeStatus === tab.value
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Card noPadding>
          {/* Search bar */}
          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoice #, shipper, consignee…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-input border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-[13px] placeholder:text-gray-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          {/* Table */}
          {isError ? (
            <div className="px-4 py-12 text-center text-[14px] text-danger">
              Failed to load invoices. Check GAS connection.
            </div>
          ) : (
            <DataTable
              columns={COLUMNS}
              data={filtered}
              rowKey={(row) => row.id}
              emptyMessage="No invoices found. Upload your first invoice."
              onRowClick={handleRowClick}
              loading={isLoading}
            />
          )}

          {/* Pagination */}
          {data && data.total > PAGE_SIZE && (
            <div className="border-t border-gray-100 px-4">
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
