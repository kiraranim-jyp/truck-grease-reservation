'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Topbar } from '@/components/admin/Topbar';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Search } from 'lucide-react';
import type { Vehicle, Profile } from '@/lib/types';

interface VehicleRow extends Vehicle {
  owner?: Profile;
}

export default function AdminVehiclesPage() {
  const supabase = createClient();
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('vehicles')
        .select('*, owner:profiles(*)')
        .order('created_at', { ascending: false });
      setVehicles((data as unknown as VehicleRow[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = vehicles.filter(
    (v) => v.plate_number.includes(search) || v.owner?.name.includes(search)
  );

  return (
    <div>
      <Topbar title="차량관리" />
      <div className="p-4 md:p-8">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" size={16} />
          <Input
            placeholder="차량번호 또는 소유자 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-steel-100 text-left text-xs text-steel-500">
                <th className="px-4 py-3 font-semibold">차량번호</th>
                <th className="px-4 py-3 font-semibold">차종</th>
                <th className="px-4 py-3 font-semibold">제조사/모델</th>
                <th className="px-4 py-3 font-semibold">소유자</th>
                <th className="px-4 py-3 font-semibold">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-50">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-steel-400">
                    불러오는 중...
                  </td>
                </tr>
              )}
              {filtered.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-3 font-mono font-bold text-graphite-900">
                    {v.plate_number}
                  </td>
                  <td className="px-4 py-3">{v.vehicle_type}</td>
                  <td className="px-4 py-3 text-steel-500">
                    {v.manufacturer || '-'} {v.model || ''}
                  </td>
                  <td className="px-4 py-3">{v.owner?.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-sm px-2 py-1 text-xs font-bold ${
                        v.is_active ? 'bg-done-light text-done' : 'bg-steel-100 text-steel-500'
                      }`}
                    >
                      {v.is_active ? '사용중' : '삭제됨'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
