'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody } from '@/components/ui/Card';
import { StatusBadge } from '@/components/customer/StatusBadge';
import { formatDateTime, formatPrice } from '@/lib/utils';
import type { Reservation } from '@/lib/types';
import { CalendarPlus, CheckCircle2, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ReservationsPage() {
  return (
    <Suspense fallback={null}>
      <ReservationsList />
    </Suspense>
  );
}

function ReservationsList() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const created = Number(searchParams.get('created') || 0);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase
        .from('reservations')
        .select('*, vehicle:vehicles(*), service:services(*)')
        .eq('customer_id', userData.user.id)
        .order('reserved_date', { ascending: false })
        .order('reserved_time', { ascending: false });
      setReservations((data as unknown as Reservation[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      {created > 1 && (
        <div className="mb-4 flex items-center gap-2 rounded bg-done-light px-4 py-3 text-sm font-semibold text-done">
          <CheckCircle2 size={18} /> {created}건의 예약이 정상적으로 접수되었습니다. 승인 결과를
          알림으로 안내드릴게요.
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-graphite-900">내 예약</h1>
          <p className="mt-1 text-sm text-steel-500">예약 내역과 진행 상태를 확인하세요</p>
        </div>
        <Link href="/reservations/new">
          <Button size="sm">
            <CalendarPlus size={16} /> 새 예약
          </Button>
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {loading && <p className="text-sm text-steel-400">불러오는 중...</p>}
        {!loading && reservations.length === 0 && (
          <Card>
            <CardBody className="flex flex-col items-center py-16 text-center">
              <ClipboardList className="text-steel-400" size={36} />
              <p className="mt-3 font-semibold text-graphite-900">예약 내역이 없어요</p>
              <Link href="/reservations/new" className="mt-4">
                <Button size="sm">첫 예약 하러가기</Button>
              </Link>
            </CardBody>
          </Card>
        )}
        {reservations.map((r) => (
          <Link key={r.id} href={`/reservations/${r.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardBody className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-bold text-graphite-900">
                      {r.vehicle?.plate_number}
                    </p>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 text-sm text-steel-600">{r.service?.name}</p>
                  <p className="mt-0.5 text-xs text-steel-400">
                    {formatDateTime(r.reserved_date, r.reserved_time)}
                  </p>
                </div>
                <p className="font-mono font-bold text-graphite-900">
                  {formatPrice(r.final_price)}
                </p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
