'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CalendarPlus, ClipboardList, Truck, Gift, User } from 'lucide-react';

const TABS = [
  { href: '/reservations/new', label: '예약', icon: CalendarPlus },
  { href: '/reservations', label: '내예약', icon: ClipboardList },
  { href: '/vehicles', label: '차량', icon: Truck },
  { href: '/referral', label: '초대', icon: Gift },
  { href: '/mypage', label: 'MY', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-steel-100 bg-white md:hidden">
      <div className="mx-auto flex max-w-5xl">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold',
                active ? 'text-safety' : 'text-steel-400'
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
