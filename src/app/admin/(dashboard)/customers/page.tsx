'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Topbar } from '@/components/admin/Topbar';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { maskPhone, formatDate } from '@/lib/utils';
import type { Profile } from '@/lib/types';
import { Search } from 'lucide-react';

interface CustomerRow extends Profile {
  reservation_count?: number;
}

export default function AdminCustomersPage() {
  const supabase = createClient();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false });
      setCustomers((data as Profile[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = customers.filter(
    (c) => c.name.includes(search) || c.phone.includes(search)
  );

  return (
    <div>
      <Topbar title="고객관리" />
      <div className="p-4 md:p-8">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" size={16} />
          <Input
            placeholder="이름 또는 전화번호 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-steel-100 text-left text-xs text-steel-500">
                <th className="px-4 py-3 font-semibold">이름</th>
                <th className="px-4 py-3 font-semibold">연락처</th>
                <th className="px-4 py-3 font-semibold">가입경로</th>
                <th className="px-4 py-3 font-semibold">추천코드</th>
                <th className="px-4 py-3 font-semibold">가입일</th>
                <th className="px-4 py-3 font-semibold">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-50">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-steel-400">
                    불러오는 중...
                  </td>
                </tr>
              )}
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-semibold text-graphite-900">{c.name}</td>
                  <td className="px-4 py-3 font-mono">{maskPhone(c.phone)}</td>
                  <td className="px-4 py-3 capitalize">{c.login_provider || '-'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.referral_code}</td>
                  <td className="px-4 py-3 text-xs text-steel-500">{formatDate(c.created_at)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-sm px-2 py-1 text-xs font-bold ${
                        c.is_active ? 'bg-done-light text-done' : 'bg-steel-100 text-steel-500'
                      }`}
                    >
                      {c.is_active ? '활성' : '비활성'}
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
