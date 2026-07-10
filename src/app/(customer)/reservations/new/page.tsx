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

interface MyCoupon {
  id: string;
  coupon: {
    id: string;
    name: string;
    type: 'fixed' | 'percent';
    value: number;
    max_discount: number | null;
    min_price: number;
  };
}

export default function NewReservationPage() {
  const supabase = createClient();
  const router = useRouter();

  const [userId, setUserId] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<OperatingSettings | null>(null);
  const [myCoupons, setMyCoupons] = useState<MyCoupon[]>([]);

  const [vehicleIds, setVehicleIds] = useState<string[]>([]);
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('');
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedCouponId, setSelectedCouponId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/login?redirect=/reservations/new');
        return;
      }
      setUserId(userData.user.id);
      const [{ data: v }, { data: s }, { data: st }, { data: profile }, { data: uc }] =
        await Promise.all([
          supabase.from('vehicles').select('*').eq('owner_id', userData.user.id).eq('is_active', true),
          supabase.from('services').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('operating_settings').select('*').eq('id', 1).single(),
          supabase.from('profiles').select('phone').eq('id', userData.user.id).single(),
          supabase
            .from('user_coupons')
            .select('id, coupon:coupons(id, name, type, value, max_discount, min_price)')
            .eq('profile_id', userData.user.id)
            .eq('is_used', false),
        ]);
      setVehicles((v as Vehicle[]) || []);
      setServices((s as Service[]) || []);
      setSettings(st as OperatingSettings);
      setPhone(profile?.phone || '');
      setMyCoupons((uc as unknown as MyCoupon[]) || []);
      if (v && v.length > 0) setVehicleIds([v[0].id]);
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

  // 가능한(마감되지 않은) 시간만 노출
  const availableSlots = useMemo(
    () => allSlots.filter((t) => !bookedTimes.includes(t)),
    [allSlots, bookedTimes]
  );

  const isClosedDay = useMemo(() => {
    if (!settings) return false;
    const day = new Date(date + 'T00:00:00').getDay();
    return settings.closed_weekdays.includes(day) || settings.blocked_dates.includes(date);
  }, [date, settings]);

  const selectedService = services.find((s) => s.id === serviceId);
  const price = selectedService?.price || 0;
  const selectedCoupon = myCoupons.find((c) => c.id === selectedCouponId)?.coupon;
  const discount = useMemo(() => {
    if (!selectedCoupon || price < selectedCoupon.min_price) return 0;
    let d =
      selectedCoupon.type === 'fixed'
        ? selectedCoupon.value
        : Math.floor((price * selectedCoupon.value) / 100);
    if (selectedCoupon.max_discount) d = Math.min(d, selectedCoupon.max_discount);
    return d;
  }, [selectedCoupon, price]);
  const finalPrice = Math.max(price - discount, 0);
  const totalFinalPrice = finalPrice * vehicleIds.length;

  function toggleVehicle(id: string) {
    setVehicleIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  async function submit() {
    setError('');
    if (vehicleIds.length === 0 || !serviceId || !date || !time) {
      setError('차량, 서비스, 날짜, 시간을 모두 선택해주세요.');
      return;
    }
    if (!phone || !address) {
      setError('연락처와 주소를 모두 입력해주세요.');
      return;
    }
    setSubmitting(true);

    const { error: phoneError } = await supabase.from('profiles').update({ phone }).eq('id', userId);
    if (phoneError) {
      setSubmitting(false);
      setError(
        phoneError.code === '23505'
          ? '이미 다른 계정에 등록된 연락처입니다.'
          : '연락처 저장 중 오류가 발생했습니다: ' + phoneError.message
      );
      return;
    }

    const { data, error } = await supabase
      .from('reservations')
      .insert(
        vehicleIds.map((vehicleId) => ({
          customer_id: userId,
          vehicle_id: vehicleId,
          service_id: serviceId,
          reserved_date: date,
          reserved_time: time,
          status: 'requested',
          price,
          coupon_id: selectedCoupon?.id || null,
          discount_amount: discount,
          final_price: finalPrice,
          customer_memo: memo || null,
          address,
        }))
      )
      .select('id');

    setSubmitting(false);
    if (error) {
      setError('예약 접수 중 오류가 발생했습니다: ' + error.message);
      return;
    }
    if (data.length === 1) {
      router.push(`/reservations/${data[0].id}?created=1`);
    } else {
      router.push(`/reservations?created=${data.length}`);
    }
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
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-steel-500">1. 차량 선택</h2>
          <span className="text-xs text-steel-400">
            여러 대를 함께 예약하려면 차량을 여러 개 선택하세요 · {vehicleIds.length}대 선택됨
          </span>
        </CardHeader>
        <CardBody className="grid gap-2 sm:grid-cols-2">
          {vehicles.map((v) => (
            <button
              key={v.id}
              onClick={() => toggleVehicle(v.id)}
              className={cn(
                'rounded border px-4 py-3 text-left transition-colors',
                vehicleIds.includes(v.id)
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
              <Label className="mt-4">방문 시간 (예약 가능한 시간만 표시됩니다)</Label>
              {availableSlots.length === 0 ? (
                <p className="mt-2 text-xs text-steel-400">이 날짜는 예약 가능한 시간이 없습니다.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {availableSlots.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTime(t)}
                      className={cn(
                        'rounded border py-2 text-xs font-mono font-semibold transition-colors',
                        time === t
                          ? 'border-safety bg-safety text-white'
                          : 'border-steel-100 hover:border-steel-400'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <h2 className="text-sm font-bold uppercase tracking-wide text-steel-500">
            4. 연락처 · 주소
          </h2>
        </CardHeader>
        <CardBody className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="phone">연락처 (필수)</Label>
            <Input
              id="phone"
              placeholder="010-1234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="address">방문 주소 (필수)</Label>
            <Input
              id="address"
              placeholder="차량이 있는 주소를 입력해주세요"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <h2 className="text-sm font-bold uppercase tracking-wide text-steel-500">
            5. 쿠폰 · 요청사항
          </h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <Label>보유 쿠폰 (선택)</Label>
            {myCoupons.length === 0 ? (
              <p className="text-xs text-steel-400">사용 가능한 쿠폰이 없어요.</p>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCouponId('')}
                  className={cn(
                    'w-full rounded border px-4 py-2.5 text-left text-sm transition-colors',
                    selectedCouponId === ''
                      ? 'border-safety bg-safety/5'
                      : 'border-steel-300 hover:border-steel-400'
                  )}
                >
                  쿠폰 사용 안 함
                </button>
                {myCoupons.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCouponId(c.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded border px-4 py-2.5 text-left text-sm transition-colors',
                      selectedCouponId === c.id
                        ? 'border-safety bg-safety/5'
                        : 'border-steel-300 hover:border-steel-400'
                    )}
                  >
                    <span className="font-semibold text-graphite-900">{c.coupon.name}</span>
                    <span className="font-mono text-xs text-steel-500">
                      {c.coupon.type === 'percent'
                        ? `${c.coupon.value}% 할인`
                        : `${formatPrice(c.coupon.value)} 할인`}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {selectedCoupon && price < selectedCoupon.min_price && (
              <p className="mt-1.5 text-xs font-semibold text-red-600">
                최소 주문금액({formatPrice(selectedCoupon.min_price)}) 이상부터 사용 가능합니다.
              </p>
            )}
          </div>
          <div>
            <Label>요청사항 (선택)</Label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              className="w-full rounded border border-steel-300 px-3.5 py-2.5 text-sm focus:border-safety focus:ring-1 focus:ring-safety"
              placeholder="예: 하부 특정 부위 확인 부탁드려요"
            />
          </div>
        </CardBody>
      </Card>

      <Card className="mt-4 border-graphite-900">
        <CardBody className="space-y-1.5">
          <div className="flex justify-between text-sm text-steel-500">
            <span>서비스 금액 (1대)</span>
            <span>{formatPrice(price)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-safety-dark">
              <span>할인 (1대)</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          {vehicleIds.length > 1 && (
            <div className="flex justify-between text-sm text-steel-500">
              <span>예약 대수</span>
              <span>{vehicleIds.length}대</span>
            </div>
          )}
          <div className="flex justify-between border-t border-steel-100 pt-2 text-base font-bold text-graphite-900">
            <span>결제 예정 금액{vehicleIds.length > 1 ? ' (총)' : ''}</span>
            <span>{formatPrice(totalFinalPrice)}</span>
          </div>
        </CardBody>
      </Card>

      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

      <Button
        className="mt-5 w-full"
        size="lg"
        onClick={submit}
        disabled={submitting || vehicleIds.length === 0}
      >
        {submitting
          ? '접수 중...'
          : vehicleIds.length > 1
            ? `${vehicleIds.length}대 예약 신청하기`
            : '예약 신청하기'}
      </Button>
      <p className="mt-2 text-center text-xs text-steel-400">
        예약 신청 후 관리자 승인이 완료되면 알림을 보내드립니다.
      </p>
    </div>
  );
}
