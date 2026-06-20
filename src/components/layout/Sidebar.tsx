'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Upload,
  History,
  LogOut,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';

const NAV_ITEMS = [
  { href: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard },
  { href: ROUTES.invoices, label: 'Invoices', icon: FileText },
  { href: ROUTES.upload, label: 'Upload', icon: Upload },
  { href: ROUTES.history, label: 'History', icon: History },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-sidebar flex-col bg-brand-900">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-input bg-accent">
          <Package className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-white leading-tight">LG Dashboard</p>
          <p className="text-[11px] text-white/50">Logistics Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
          Main Menu
        </p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'group flex items-center gap-3 rounded-input px-3 py-2.5 text-[14px] font-medium transition-colors',
              isActive(href)
                ? 'sidebar-active text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white',
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 px-3 py-4">
        <button
          className="flex w-full items-center gap-3 rounded-input px-3 py-2.5 text-[14px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          onClick={() => {/* logout handler */}}
          type="button"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
