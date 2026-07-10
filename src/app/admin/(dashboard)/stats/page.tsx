'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Topbar } from '@/components/admin/Topbar';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

const COLORS = ['#FF5A1F', '#1C1F24', '#6B7280', '#16A34A', '#F5A524'];

export default function AdminStatsPage() {
  const supabase = createClient();
  const [dailyRevenue, setDailyRevenue] = useState<{ date: string; revenue: number }[]>([]);
  const [serviceBreakdown, setServiceBreakdown] = useState<{ name: string; count: number }[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 14);
      const sinceStr = since.toISOString().slice(0, 10);

      const { data: reservations } = await supabase
        .from('reservations')
        .select('reserved_date, final_price, status, service:services(name)')
        .gte('reserved_date', sinceStr);

      const revenueMap: Record<string, number> = {};
      const serviceMap: Record<string, number> = {};
      const statusMap: Record<string, number> = {};

      (reservations || []).forEach((r: any) => {
        if (r.status === 'paid') {
          revenueMap[r.reserved_date] = (revenueMap[r.reserved_date] || 0) + r.final_price;
        }
        const sName = r.service?.name || '기타';
        serviceMap[sName] = (serviceMap[sName] || 0) + 1;
        statusMap[r.status] = (statusMap[r.status] || 0) + 1;
      });

      setDailyRevenue(
        Object.entries(revenueMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, revenue]) => ({ date: date.slice(5), revenue }))
      );
      setServiceBreakdown(Object.entries(serviceMap).map(([name, count]) => ({ name, count })));
      setStatusBreakdown(Object.entries(statusMap).map(([name, count]) => ({ name, count })));
    })();
  }, []);

  return (
    <div>
      <Topbar title="통계" />
      <div className="p-4 md:p-8">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-bold uppercase tracking-wide text-steel-500">
              최근 14일 매출 추이 (결제완료 기준)
            </h2>
          </CardHeader>
          <CardBody style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDECE6" />
                <XAxis dataKey="date" fontSize={12} stroke="#6B7280" />
                <YAxis fontSize={12} stroke="#6B7280" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v: number) => formatPrice(v)} />
                <Bar dataKey="revenue" fill="#FF5A1F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-bold uppercase tracking-wide text-steel-500">
                서비스별 예약 비중
              </h2>
            </CardHeader>
            <CardBody style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={serviceBreakdown} dataKey="count" nameKey="name" outerRadius={90} label>
                    {serviceBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-bold uppercase tracking-wide text-steel-500">
                예약 상태 분포
              </h2>
            </CardHeader>
            <CardBody style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusBreakdown} layout="vertical">
                  <XAxis type="number" fontSize={12} stroke="#6B7280" />
                  <YAxis type="category" dataKey="name" fontSize={12} width={90} stroke="#6B7280" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1C1F24" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
