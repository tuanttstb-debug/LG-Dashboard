import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { Card, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { FileText, Upload, Clock, CheckCircle, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = { title: 'Dashboard' };

const KPI_CARDS = [
  {
    label: 'Total Invoices',
    value: '—',
    sub: 'All time',
    icon: FileText,
    color: 'text-brand bg-brand-100',
  },
  {
    label: 'Uploaded Today',
    value: '—',
    sub: 'Today',
    icon: Upload,
    color: 'text-accent bg-accent-100',
  },
  {
    label: 'Pending Review',
    value: '—',
    sub: 'Needs attention',
    icon: Clock,
    color: 'text-warning bg-warning-light',
  },
  {
    label: 'Exported',
    value: '—',
    sub: 'This month',
    icon: CheckCircle,
    color: 'text-success bg-success-light',
  },
] as const;

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar
        title="Dashboard"
        actions={
          <Link href={ROUTES.upload}>
            <Button size="md" className="gap-2">
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

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <Link
              href={ROUTES.invoices}
              className="flex items-center gap-1 text-[13px] font-medium text-brand hover:underline"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>

          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-[15px] font-medium text-gray-500">No invoices yet</p>
            <p className="mt-1 text-[13px] text-gray-400">
              Upload your first invoice to get started
            </p>
            <Link href={ROUTES.upload} className="mt-4">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4" />
                Upload Invoice
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
