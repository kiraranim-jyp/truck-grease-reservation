'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const LINKS = [
  { href: '/reservations/new', label: '예약하기' },
  { href: '/reservations', label: '내 예약' },
  { href: '/vehicles', label: '내 차량' },
  { href: '/referral', label: '친구초대' },
];

export function Navbar() {
  const pathname = usePathname();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', userData.user.id)
        .single();
      setReferralCode(data?.referral_code || null);
    })();
  }, [pathname]);

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
        <div className="flex items-center gap-3">
          {referralCode && (
            <Link
              href="/referral"
              className="hidden items-center gap-1.5 rounded border border-steel-700 px-2.5 py-1 text-xs text-steel-300 hover:border-safety hover:text-white sm:flex"
              title="내 초대코드"
            >
              <span className="text-steel-500">MY CODE</span>
              <span className="font-mono font-semibold tracking-wide">{referralCode}</span>
            </Link>
          )}
          <Link
            href="/mypage"
            className="rounded bg-safety px-3.5 py-1.5 text-sm font-semibold text-white"
          >
            내 정보
          </Link>
        </div>
      </div>
    </header>
  );
}
