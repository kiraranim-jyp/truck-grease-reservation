'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/reservations/new', label: '예약하기' },
  { href: '/reservations', label: '내 예약' },
  { href: '/vehicles', label: '내 차량' },
  { href: '/referral', label: '친구초대' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-graphite-900 text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 bg-safety" />
          <span className="font-display text-lg font-semibold tracking-wide">
            TRUCK GREASE
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'text-sm font-medium text-steel-400 hover:text-white transition-colors',
                pathname.startsWith(l.href) && 'text-white'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/mypage"
          className="rounded bg-safety px-3.5 py-1.5 text-sm font-semibold text-white"
        >
          내 정보
        </Link>
      </div>
    </header>
  );
}
