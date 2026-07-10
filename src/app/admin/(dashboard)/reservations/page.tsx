'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Topbar } from '@/components/admin/Topbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/customer/StatusBadge';
import { formatDateTime, formatPrice, maskPhone } from '@/lib/utils';
import type { Reservation, ReservationStatus } from '@/lib/types';
import { STATUS_LABEL } from '@/lib/types';

const FILTERS: { value: ReservationStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'requested', label: '예약' },
  { value: 'pending_approval', label: '승인대기' },
  { value: 'approved', label: '승인' },
  { value: 'visited', label: '방문' },
  { value: 'completed', label: '완료' },
  { value: 'paid', label: '결제완료' },
  { value: 'rejected', label: '반려' },
  { value: 'cancelled', label: '취소' },
];

export default function AdminReservationsPage() {
  return (
    <Suspense fallback={null}>
      <AdminReservationsContent />
    </Suspense>
  );
}

function AdminReservationsContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<ReservationStatus | 'all'>(
    (searchParams.get('status') as ReservationStatus) || 'all'
  );
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('reservations')
      .select('*, vehicle:vehicles(*), service:services(*), customer:profiles(*)')
      .order('reserved_date', { ascending: false })
      .order('reserved_time', { ascending: false })
      .limit(100);
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    setReservations((data as unknown as Reservation[]) || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(id: string, status: ReservationStatus, extra?: Record<string, unknown>) {
    await fetch(`/api/reservations/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...extra }),
    });
    load();
  }

  function confirmReject(id: string) {
    setRejectingId(id);
    setRejectReason('');
  }

  async function submitReject() {
    if (!rejectingId) return;
    await changeStatus(rejectingId, 'rejected', { rejected_reason: rejectReason });
    setRejectingId(null);
  }

  return (
    <div>
      <Topbar title="예약관리" />
      <div className="p-4 md:p-8">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.value
                  ? 'border-graphite-900 bg-graphite-900 text-white'
                  : 'border-steel-100 bg-white text-steel-500 hover:border-steel-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Card className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-steel-100 text-left text-xs text-steel-500">
                <th className="px-4 py-3 font-semibold">방문일시</th>
                <th className="px-4 py-3 font-semibold">고객</th>
                <th className="px-4 py-3 font-semibold">차량</th>
                <th className="px-4 py-3 font-semibold">서비스</th>
                <th className="px-4 py-3 font-semibold">금액</th>
                <th className="px-4 py-3 font-semibold">상태</th>
                <th className="px-4 py-3 font-semibold">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-50">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-steel-400">
                    불러오는 중...
                  </td>
                </tr>
              )}
              {!loading && reservations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-steel-400">
                    해당하는 예약이 없습니다.
                  </td>
                </tr>
              )}
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                    {formatDateTime(r.reserved_date, r.reserved_time)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-graphite-900">{r.customer?.name}</p>
                    <p className="text-xs text-steel-400">{maskPhone(r.customer?.phone || '')}</p>
                  </td>
                  <td className="px-4 py-3 font-mono">{r.vehicle?.plate_number}</td>
                  <td className="px-4 py-3">{r.service?.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono">{formatPrice(r.final_price)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(r.status === 'requested' || r.status === 'pending_approval') && (
                        <>
                          <Button size="sm" onClick={() => changeStatus(r.id, 'approved')}>
                            승인
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => confirmReject(r.id)}>
                            반려
                          </Button>
                        </>
                      )}
                      {r.status === 'approved' && (
                        <Button size="sm" onClick={() => changeStatus(r.id, 'visited')}>
                          방문처리
                        </Button>
                      )}
                      {r.status === 'visited' && (
                        <Button size="sm" onClick={() => changeStatus(r.id, 'completed')}>
                          완료처리
                        </Button>
                      )}
                      {r.status === 'completed' && (
                        <Button size="sm" variant="dark" onClick={() => changeStatus(r.id, 'paid')}>
                          결제완료
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <Card className="w-full max-w-sm">
            <div className="p-5">
              <h3 className="font-display text-lg font-bold text-graphite-900">예약 반려</h3>
              <p className="mt-1 text-xs text-steel-500">반려 사유를 입력하면 고객에게 안내됩니다.</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="mt-3 w-full rounded border border-steel-100 px-3 py-2 text-sm focus:border-safety focus:ring-1 focus:ring-safety"
                placeholder="예: 해당 시간에 정비소 사정으로 서비스가 어렵습니다."
              />
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setRejectingId(null)}>
                  취소
                </Button>
                <Button variant="danger" size="sm" onClick={submitReject}>
                  반려 확정
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
