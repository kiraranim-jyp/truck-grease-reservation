'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { maskPhone, formatPrice } from '@/lib/utils';
import type { Profile } from '@/lib/types';
import { LogOut, Ticket } from 'lucide-react';

interface MyCoupon {
  id: string;
  is_used: boolean;
  coupon: { name: string; type: string; value: number; valid_until: string | null };
}

export default function MyPage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [coupons, setCoupons] = useState<MyCoupon[]>([]);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/login');
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', userData.user.id).single();
      setProfile(data as Profile);

      const { data: uc } = await supabase
        .from('user_coupons')
        .select('id, is_used, coupon:coupons(name, type, value, valid_until)')
        .eq('profile_id', userData.user.id)
        .eq('is_used', false);
      setCoupons((uc as unknown as MyCoupon[]) || []);
    })();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  if (!profile) return <p className="text-sm text-steel-400">불러오는 중...</p>;

  return (
    <div className="mx-auto max-w-md py-2">
      <h1 className="font-display text-2xl font-bold text-graphite-900">마이페이지</h1>

      <Card className="mt-5">
        <CardBody className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg font-bold text-graphite-900">{profile.name}</p>
            <p className="text-sm text-steel-500">{maskPhone(profile.phone)}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut size={14} /> 로그아웃
          </Button>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-steel-500">보유 쿠폰</h2>
          <Ticket size={16} className="text-steel-400" />
        </CardHeader>
        <CardBody className="space-y-2">
          {coupons.length === 0 && (
            <p className="py-4 text-center text-sm text-steel-400">보유한 쿠폰이 없어요</p>
          )}
          {coupons.map((c) => (
            <div key={c.id} className="rounded border border-dashed border-safety/40 bg-safety/5 px-4 py-3">
              <p className="font-semibold text-graphite-900">{c.coupon.name}</p>
              <p className="text-xs text-steel-500">
                {c.coupon.type === 'percent' ? `${c.coupon.value}% 할인` : `${formatPrice(c.coupon.value)} 할인`}
                {c.coupon.valid_until ? ` · ~${c.coupon.valid_until.slice(0, 10)}까지` : ''}
              </p>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
