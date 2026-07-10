'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Topbar } from '@/components/admin/Topbar';
import { Card, CardBody } from '@/components/ui/Card';
import { StatusBadge } from '@/components/customer/StatusBadge';
import { formatPrice } from '@/lib/utils';
import type { Reservation } from '@/lib/types';
import { Clock, AlertCircle, CheckCircle2, Wallet } from 'lucide-react';

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [today, setToday] = useState<Reservation[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);

  useEffect(() => {
    (async () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const monthStart = todayStr.slice(0, 7) + '-01';

      const { data: todayList } = await supabase
        .from('reservations')
        .select('*, vehicle:vehicles(*), service:services(*)')
        .eq('reserved_date', todayStr)
        .order('reserved_time');
      setToday((todayList as unknown as Reservation[]) || []);

      const { count } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['requested', 'pending_approval']);
      setPendingCount(count || 0);

      const { data: paidToday } = await supabase
        .from('reservations')
        .select('final_price')
        .eq('reserved_date', todayStr)
        .eq('status', 'paid');
      setTodayRevenue((paidToday || []).reduce((s, r: any) => s + r.final_price, 0));

      const { data: paidMonth } = await supabase
        .from('reservations')
        .select('final_price')
        .gte('reserved_date', monthStart)
        .eq('status', 'paid');
      setMonthRevenue((paidMonth || []).reduce((s, r: any) => s + r.final_price, 0));
    })();
  }, []);

  return (
    <div>
      <Topbar title="Dashboard" />
      <div className="p-4 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<AlertCircle className="text-warn" size={20} />}
            label="승인 대기"
            value={`${pendingCount}건`}
            href="/admin/reservations?status=pending_approval"
          />
          <StatCard
            icon={<Clock className="text-safety" size={20} />}
            label="오늘 예약"
            value={`${today.length}건`}
          />
          <StatCard
            icon={<CheckCircle2 className="text-done" size={20} />}
            label="오늘 매출"
            value={formatPrice(todayRevenue)}
          />
          <StatCard
            icon={<Wallet className="text-graphite-900" size={20} />}
            label="이번달 매출"
            value={formatPrice(monthRevenue)}
          />
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-graphite-900">오늘의 예약</h2>
            <Link href="/admin/reservations" className="text-sm font-semibold text-safety">
              전체보기
            </Link>
          </div>
          <Card className="mt-3">
            <div className="divide-y divide-steel-50">
              {today.length === 0 && (
                <p className="px-5 py-10 text-center text-sm text-steel-400">
                  오늘 예약이 없습니다.
                </p>
              )}
              {today.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-4">
                    <p className="font-mono text-sm font-bold text-graphite-900">
                      {r.reserved_time.slice(0, 5)}
                    </p>
                    <div>
                      <p className="text-sm font-semibold text-graphite-900">
                        {r.vehicle?.plate_number} · {r.service?.name}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <Card>
      <CardBody className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-steel-50">{icon}</div>
        <div>
          <p className="text-xs font-semibold text-steel-500">{label}</p>
          <p className="font-display text-xl font-bold text-graphite-900">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
