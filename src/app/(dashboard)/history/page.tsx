import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/common/Card';
import { History } from 'lucide-react';

export const metadata: Metadata = { title: 'History' };

export default function HistoryPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar title="Version History" />

      <main className="flex-1 overflow-auto p-6">
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <History className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-[15px] font-medium text-gray-500">No history yet</p>
            <p className="mt-1 text-[13px] text-gray-400">
              Version history will appear here after invoices are saved
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
