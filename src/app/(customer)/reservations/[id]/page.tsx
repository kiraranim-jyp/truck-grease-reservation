'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ReservationGauge } from '@/components/customer/ReservationGauge';
import { StatusBadge } from '@/components/customer/StatusBadge';
import { formatDateTime, formatPrice } from '@/lib/utils';
import type { Reservation } from '@/lib/types';
import { CheckCircle2, MapPin, Star, Truck } from 'lucide-react';
import Link from 'next/link';

export default function ReservationDetailPage() {
  return (
    <Suspense fallback={null}>
      <ReservationDetailContent />
    </Suspense>
  );
}

function ReservationDetailContent() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [hasReview, setHasReview] = useState(false);

  async function load() {
    const { data } = await supabase
      .from('reservations')
      .select('*, vehicle:vehicles(*), service:services(*)')
      .eq('id', id)
      .single();
    setReservation(data as unknown as Reservation);

    const { data: review } = await supabase
      .from('reviews')
      .select('id')
      .eq('reservation_id', id)
      .maybeSingle();
    setHasReview(!!review);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function cancel() {
    if (!confirm('예약을 취소하시겠습니까?')) return;
    setCancelling(true);
    await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', id);
    setCancelling(false);
    load();
  }

  if (loading) return <p className="text-sm text-steel-400">불러오는 중...</p>;
  if (!reservation) return <p className="text-sm text-steel-400">예약을 찾을 수 없습니다.</p>;

  const canCancel = ['requested', 'pending_approval', 'approved'].includes(reservation.status);
  const canReview = reservation.status === 'paid' || reservation.status === 'completed';

  return (
    <div className="pb-8">
      {searchParams.get('created') && (
        <div className="mb-4 flex items-center gap-2 rounded bg-done-light px-4 py-3 text-sm font-semibold text-done">
          <CheckCircle2 size={18} /> 예약이 정상적으로 접수되었습니다. 승인 결과를 알림으로 안내드릴게요.
        </div>
      )}

      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl font-bold text-graphite-900">예약 상세</h1>
        <StatusBadge status={reservation.status} />
      </div>

      <Card className="mt-5">
        <CardBody>
          <ReservationGauge status={reservation.status} />
        </CardBody>
      </Card>

      {/* 요약 카드 */}
      <Card className="mt-4 overflow-hidden">
        <div className="flex items-center gap-3 bg-graphite-900 px-5 py-4 text-white">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-white/10">
            <Truck size={20} />
          </div>
          <div>
            <p className="font-mono text-lg font-bold">{reservation.vehicle?.plate_number}</p>
            <p className="text-xs text-steel-400">
              {reservation.vehicle?.vehicle_type} · {reservation.service?.name}
            </p>
          </div>
        </div>
        <CardBody className="space-y-3 text-sm">
          <Row label="방문 일시" value={formatDateTime(reservation.reserved_date, reservation.reserved_time)} />
          {reservation.address && (
            <div className="flex items-start justify-between gap-4 border-b border-steel-50 pb-3">
              <span className="flex shrink-0 items-center gap-1 text-steel-500">
                <MapPin size={13} /> 방문 주소
              </span>
              <span className="text-right font-semibold text-graphite-900">{reservation.address}</span>
            </div>
          )}
          {reservation.customer_memo && <Row label="요청사항" value={reservation.customer_memo} />}
          {reservation.status === 'rejected' && reservation.rejected_reason && (
            <Row label="반려 사유" value={reservation.rejected_reason} danger />
          )}
        </CardBody>
        <div className="space-y-1.5 border-t border-steel-100 bg-steel-50 px-5 py-4">
          <div className="flex justify-between text-sm text-steel-500">
            <span>서비스 금액</span>
            <span>{formatPrice(reservation.price)}</span>
          </div>
          {reservation.discount_amount > 0 && (
            <div className="flex justify-between text-sm text-safety-dark">
              <span>할인</span>
              <span>-{formatPrice(reservation.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-steel-100 pt-2 text-base font-bold text-graphite-900">
            <span>결제 금액</span>
            <span>{formatPrice(reservation.final_price)}</span>
          </div>
        </div>
      </Card>

      <div className="mt-5 flex gap-2">
        {canCancel && (
          <Button variant="secondary" onClick={cancel} disabled={cancelling}>
            {cancelling ? '취소 중...' : '예약 취소'}
          </Button>
        )}
        {canReview && !hasReview && (
          <Link href={`/reservations/${id}/review`}>
            <Button>
              <Star size={16} /> 후기 작성하기
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-steel-50 pb-3 last:border-0 last:pb-0">
      <span className="shrink-0 text-steel-500">{label}</span>
      <span className={danger ? 'text-right font-semibold text-red-600' : 'text-right font-semibold text-graphite-900'}>
        {value}
      </span>
    </div>
  );
}
