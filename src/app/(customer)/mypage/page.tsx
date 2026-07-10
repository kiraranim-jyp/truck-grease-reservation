'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/customer/StatusBadge';
import { maskPhone, formatPrice, formatDateTime } from '@/lib/utils';
import type { Profile, Vehicle, Reservation } from '@/lib/types';
import { LogOut, Ticket, Copy, Truck, ClipboardList, ChevronRight } from 'lucide-react';

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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/login');
        return;
      }
      const userId = userData.user.id;

      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      setProfile(data as Profile);

      const { data: uc } = await supabase
        .from('user_coupons')
        .select('id, is_used, coupon:coupons(name, type, value, valid_until)')
        .eq('profile_id', userId)
        .eq('is_used', false);
      setCoupons((uc as unknown as MyCoupon[]) || []);

      const { data: v } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setVehicles((v as Vehicle[]) || []);

      const { data: r } = await supabase
        .from('reservations')
        .select('*, vehicle:vehicles(*), service:services(*)')
        .eq('customer_id', userId)
        .order('reserved_date', { ascending: false })
        .order('reserved_time', { ascending: false })
        .limit(5);
      setReservations((r as unknown as Reservation[]) || []);
    })();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function copyReferralLink() {
    if (!profile) return;
    const link = `${window.location.origin}/signup?ref=${profile.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!profile) return <p className="text-sm text-steel-400">불러오는 중...</p>;

  return (
    <div className="mx-auto max-w-md py-2">
      <h1 className="font-display text-2xl font-bold text-graphite-900">마이페이지</h1>

      {/* 내 프로필 정보 */}
      <Card className="mt-5">
        <CardBody>
          <p className="font-display text-lg font-bold text-graphite-900">{profile.name}</p>
          <p className="text-sm text-steel-500">{maskPhone(profile.phone)}</p>
        </CardBody>
        <div className="border-t border-steel-100 px-5 py-4">
          <p className="text-xs text-steel-400">내 초대코드 (친구초대 시 사용)</p>
          <div className="mt-1 flex items-center justify-between">
            <p className="font-mono text-xl font-bold tracking-widest text-graphite-900">
              {profile.referral_code}
            </p>
            <Button variant="secondary" size="sm" onClick={copyReferralLink}>
              <Copy size={14} /> {copied ? '복사됨' : '초대링크 복사'}
            </Button>
          </div>
        </div>
      </Card>

      {/* 내 차량 정보 */}
      <Card className="mt-4">
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-steel-500">내 차량</h2>
          <Link href="/vehicles" className="flex items-center text-xs text-steel-400 hover:text-safety">
            관리 <ChevronRight size={14} />
          </Link>
        </CardHeader>
        <CardBody className="space-y-2">
          {vehicles.length === 0 && (
            <div className="flex flex-col items-center py-6 text-center">
              <Truck className="text-steel-400" size={28} />
              <p className="mt-2 text-sm text-steel-400">등록된 차량이 없어요</p>
              <Link href="/vehicles" className="mt-3">
                <Button size="sm">차량 등록하기</Button>
              </Link>
            </div>
          )}
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded border border-steel-100 px-3.5 py-2.5"
            >
              <p className="font-mono text-sm font-bold text-graphite-900">{v.plate_number}</p>
              <p className="text-xs text-steel-500">
                {v.vehicle_type}
                {v.manufacturer ? ` · ${v.manufacturer}` : ''}
                {v.model ? ` ${v.model}` : ''}
              </p>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* 내 예약 정보 */}
      <Card className="mt-4">
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-steel-500">내 예약</h2>
          <Link href="/reservations" className="flex items-center text-xs text-steel-400 hover:text-safety">
            전체보기 <ChevronRight size={14} />
          </Link>
        </CardHeader>
        <CardBody className="space-y-2">
          {reservations.length === 0 && (
            <div className="flex flex-col items-center py-6 text-center">
              <ClipboardList className="text-steel-400" size={28} />
              <p className="mt-2 text-sm text-steel-400">예약 내역이 없어요</p>
              <Link href="/reservations/new" className="mt-3">
                <Button size="sm">첫 예약 하러가기</Button>
              </Link>
            </div>
          )}
          {reservations.map((r) => (
            <Link key={r.id} href={`/reservations/${r.id}`}>
              <div className="rounded border border-steel-100 px-3.5 py-2.5 hover:border-safety/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-bold text-graphite-900">
                      {r.vehicle?.plate_number}
                    </p>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="font-mono text-sm font-bold text-graphite-900">
                    {formatPrice(r.final_price)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-steel-500">
                  {r.vehicle?.vehicle_type} · {r.service?.name}
                </p>
                <p className="text-xs text-steel-400">
                  {formatDateTime(r.reserved_date, r.reserved_time)}
                </p>
              </div>
            </Link>
          ))}
        </CardBody>
      </Card>

      {/* 보유 쿠폰 */}
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

      <Button variant="secondary" className="mt-6 w-full" onClick={logout}>
        <LogOut size={16} /> 로그아웃
      </Button>
    </div>
  );
}
