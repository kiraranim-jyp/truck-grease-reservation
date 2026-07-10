'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Label, Input } from '@/components/ui/Input';
import { cn, formatPrice, generateTimeSlots } from '@/lib/utils';
import type { Vehicle, Service, OperatingSettings } from '@/lib/types';
import { Truck } from 'lucide-react';
import Link from 'next/link';

export default function NewReservationPage() {
  const supabase = createClient();
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<OperatingSettings | null>(null);

  const [vehicleId, setVehicleId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('');
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponId, setCouponId] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/login?redirect=/reservations/new');
        return;
      }
      const [{ data: v }, { data: s }, { data: st }] = await Promise.all([
        supabase.from('vehicles').select('*').eq('owner_id', userData.user.id).eq('is_active', true),
        supabase.from('services').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('operating_settings').select('*').eq('id', 1).single(),
      ]);
      setVehicles((v as Vehicle[]) || []);
      setServices((s as Service[]) || []);
      setSettings(st as OperatingSettings);
      if (v && v.length > 0) setVehicleId(v[0].id);
      if (s && s.length > 0) setServiceId(s[0].id);
    })();
  }, []);

  // 선택 날짜의 예약된 시간 슬롯 조회 (max_concurrent_bays 초과 시 마감 처리)
  useEffect(() => {
    if (!date || !settings) return;
    (async () => {
      const { data } = await supabase
        .from('reservations')
        .select('reserved_time')
        .eq('reserved_date', date)
        .in('status', ['requested', 'pending_approval', 'approved', 'visited']);
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        const t = r.reserved_time.slice(0, 5);
        counts[t] = (counts[t] || 0) + 1;
      });
      const full = Object.entries(counts)
        .filter(([, c]) => c >= settings.max_concurrent_bays)
        .map(([t]) => t);
      setBookedTimes(full);
    })();
  }, [date, settings]);

  const allSlots = useMemo(() => {
    if (!settings) return [];
    return generateTimeSlots(
      settings.open_time.slice(0, 5),
      settings.close_time.slice(0, 5),
      settings.slot_minutes
    );
  }, [settings]);

  const isClosedDay = useMemo(() => {
    if (!settings) return false;
    const day = new Date(date + 'T00:00:00').getDay();
    return settings.closed_weekdays.includes(day) || settings.blocked_dates.includes(date);
  }, [date, settings]);

  const selectedService = services.find((s) => s.id === serviceId);
  const price = selectedService?.price || 0;
  const finalPrice = Math.max(price - discount, 0);

  async function applyCoupon() {
    setCouponMsg('');
    setDiscount(0);
    setCouponId(null);
    if (!couponCode) return;
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.trim().toUpperCase())
      .eq('is_active', true)
      .maybeSingle();
    if (!coupon) {
      setCouponMsg('유효하지 않은 쿠폰 코드입니다.');
      return;
    }
    if (coupon.used_count >= coupon.usage_limit) {
      setCouponMsg('사용 가능 횟수를 초과한 쿠폰입니다.');
      return;
    }
    if (price < coupon.min_price) {
      setCouponMsg(`최소 주문금액(${formatPrice(coupon.min_price)}) 이상부터 사용 가능합니다.`);
      return;
    }
    let d = coupon.type === 'fixed' ? coupon.value : Math.floor((price * coupon.value) / 100);
    if (coupon.max_discount) d = Math.min(d, coupon.max_discount);
    setDiscount(d);
    setCouponId(coupon.id);
    setCouponMsg(`${formatPrice(d)} 할인이 적용되었습니다.`);
  }

  async function submit() {
    setError('');
    if (!vehicleId || !serviceId || !date || !time) {
      setError('차량, 서비스, 날짜, 시간을 모두 선택해주세요.');
      return;
    }
    setSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        customer_id: userData.user.id,
        vehicle_id: vehicleId,
        service_id: serviceId,
        reserved_date: date,
        reserved_time: time,
        status: 'requested',
        price,
        coupon_id: couponId,
        discount_amount: discount,
        final_price: finalPrice,
        customer_memo: memo || null,
      })
      .select('id')
      .single();

    setSubmitting(false);
    if (error) {
      setError('예약 접수 중 오류가 발생했습니다: ' + error.message);
      return;
    }
    router.push(`/reservations/${data.id}?created=1`);
  }

  if (vehicles.length === 0 && services.length > 0) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center py-16 text-center">
          <Truck className="text-steel-400" size={36} />
          <p className="mt-3 font-semibold text-graphite-900">먼저 차량을 등록해주세요</p>
          <p className="mt-1 text-sm text-steel-500">예약하려면 차량 등록이 필요합니다.</p>
          <Link href="/vehicles" className="mt-4">
            <Button size="sm">차량 등록하러 가기</Button>
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="pb-8">
      <h1 className="font-display text-2xl font-bold text-graphite-900">예약하기</h1>
      <p className="mt-1 text-sm text-steel-500">차량과 원하는 시간을 선택해주세요</p>

      <Card className="mt-5">
        <CardHeader>
          <h2 className="text-sm font-bold uppercase tracking-wide text-steel-500">1. 차량 선택</h2>
        </CardHeader>
        <CardBody className="grid gap-2 sm:grid-cols-2">
          {vehicles.map((v) => (
            <button
              key={v.id}
              onClick={() => setVehicleId(v.id)}
              className={cn(
                'rounded border px-4 py-3 text-left transition-colors',
                vehicleId === v.id
                  ? 'border-safety bg-safety/5'
                  : 'border-steel-100 hover:border-steel-400'
              )}
            >
              <p className="font-mono font-bold text-graphite-900">{v.plate_number}</p>
              <p className="text-xs text-steel-500">{v.vehicle_type}</p>
            </button>
          ))}
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <h2 className="text-sm font-bold uppercase tracking-wide text-steel-500">
            2. 서비스 선택
          </h2>
        </CardHeader>
        <CardBody className="space-y-2">
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => setServiceId(s.id)}
              className={cn(
                'flex w-full items-center justify-between rounded border px-4 py-3 text-left transition-colors',
                serviceId === s.id
                  ? 'border-safety bg-safety/5'
                  : 'border-steel-100 hover:border-steel-400'
              )}
            >
              <div>
                <p className="font-semibold text-graphite-900">{s.name}</p>
                <p className="text-xs text-steel-500">
                  약 {s.duration_minutes}분 · {s.description}
                </p>
              </div>
              <p className="font-mono font-bold text-graphite-900">{formatPrice(s.price)}</p>
            </button>
          ))}
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <h2 className="text-sm font-bold uppercase tracking-wide text-steel-500">
            3. 날짜 · 시간 선택
          </h2>
        </CardHeader>
        <CardBody>
          <Label htmlFor="date">방문 날짜</Label>
          <Input
            id="date"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setTime('');
            }}
          />
          {isClosedDay && (
            <p className="mt-2 text-xs font-semibold text-red-600">휴무일입니다. 다른 날짜를 선택해주세요.</p>
          )}
          {!isClosedDay && (
            <>
              <Label className="mt-4">방문 시간</Label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {allSlots.map((t) => {
                  const full = bookedTimes.includes(t);
                  return (
                    <button
                      key={t}
                      disabled={full}
                      onClick={() => setTime(t)}
                      className={cn(
                        'rounded border py-2 text-xs font-mono font-semibold transition-colors',
                        full && 'cursor-not-allowed border-steel-100 bg-steel-50 text-steel-400 line-through',
                        !full && time === t && 'border-safety bg-safety text-white',
                        !full && time !== t && 'border-steel-100 hover:border-steel-400'
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <h2 className="text-sm font-bold uppercase tracking-wide text-steel-500">
            4. 쿠폰 · 요청사항
          </h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <Label>쿠폰 코드 (선택)</Label>
            <div className="flex gap-2">
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="쿠폰 코드 입력"
              />
              <Button variant="secondary" onClick={applyCoupon}>
                적용
              </Button>
            </div>
            {couponMsg && (
              <p
                className={cn(
                  'mt-1.5 text-xs font-semibold',
                  discount > 0 ? 'text-done' : 'text-red-600'
                )}
              >
                {couponMsg}
              </p>
            )}
          </div>
          <div>
            <Label>요청사항 (선택)</Label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              className="w-full rounded border border-steel-100 px-3.5 py-2.5 text-sm focus:border-safety focus:ring-1 focus:ring-safety"
              placeholder="예: 하부 특정 부위 확인 부탁드려요"
            />
          </div>
        </CardBody>
      </Card>

      <Card className="mt-4 border-graphite-900">
        <CardBody className="space-y-1.5">
          <div className="flex justify-between text-sm text-steel-500">
            <span>서비스 금액</span>
            <span>{formatPrice(price)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-safety-dark">
              <span>할인</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-steel-100 pt-2 text-base font-bold text-graphite-900">
            <span>결제 예정 금액</span>
            <span>{formatPrice(finalPrice)}</span>
          </div>
        </CardBody>
      </Card>

      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

      <Button className="mt-5 w-full" size="lg" onClick={submit} disabled={submitting}>
        {submitting ? '접수 중...' : '예약 신청하기'}
      </Button>
      <p className="mt-2 text-center text-xs text-steel-400">
        예약 신청 후 관리자 승인이 완료되면 알림을 보내드립니다.
      </p>
    </div>
  );
}
