'use client';

import { useState } from 'react';
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
  Menu,
  X,
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

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="mt-2 space-y-0.5 px-3">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
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
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 모바일: 햄버거 버튼 + 슬라이드 드로어 (데스크톱에서는 아래 고정 사이드바가 대신 보임) */}
      <button
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
        className="fixed left-3 top-3 z-40 flex h-9 w-9 items-center justify-center rounded bg-graphite-900 text-white shadow-md md:hidden"
      >
        <Menu size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col bg-graphite-900 text-white">
            <div className="flex items-center justify-between px-5 py-5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 bg-safety" />
                <span className="font-display text-base font-bold tracking-wide">ADMIN</span>
              </div>
              <button onClick={() => setOpen(false)} aria-label="메뉴 닫기" className="text-steel-400">
                <X size={20} />
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* 데스크톱: 고정 사이드바 */}
      <aside className="hidden w-60 shrink-0 border-r border-graphite-800 bg-graphite-900 text-white md:block">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="h-2.5 w-2.5 bg-safety" />
          <span className="font-display text-base font-bold tracking-wide">ADMIN</span>
        </div>
        <NavLinks pathname={pathname} />
      </aside>
    </>
  );
}
