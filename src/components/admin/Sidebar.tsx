'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Truck,
  Wrench,
  Ticket,
  Megaphone,
  Settings,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/reservations', label: '예약관리', icon: ClipboardList },
  { href: '/admin/customers', label: '고객관리', icon: Users },
  { href: '/admin/vehicles', label: '차량관리', icon: Truck },
  { href: '/admin/services', label: '서비스관리', icon: Wrench },
  { href: '/admin/coupons', label: '쿠폰관리', icon: Ticket },
  { href: '/admin/events', label: '이벤트관리', icon: Megaphone },
  { href: '/admin/settings', label: '운영설정', icon: Settings },
  { href: '/admin/stats', label: '통계', icon: BarChart3 },
  { href: '/admin/admins', label: '관리자 권한관리', icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-graphite-800 bg-graphite-900 text-white md:block">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="h-2.5 w-2.5 bg-safety" />
        <span className="font-display text-base font-bold tracking-wide">ADMIN</span>
      </div>
      <nav className="mt-2 space-y-0.5 px-3">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-steel-400 transition-colors hover:bg-graphite-800 hover:text-white',
                active && 'bg-safety/15 text-safety'
              )}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
