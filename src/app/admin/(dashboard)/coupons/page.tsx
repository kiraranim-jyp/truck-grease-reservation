'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Topbar } from '@/components/admin/Topbar';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Input';
import { formatPrice, maskPhone } from '@/lib/utils';
import type { Coupon, Profile } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';

const emptyCoupon = (): Partial<Coupon> => ({
  code: '',
  name: '',
  type: 'fixed',
  value: 5000,
  min_price: 0,
  usage_limit: 100,
  is_active: true,
});

export default function AdminCouponsPage() {
  const supabase = createClient();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [editing, setEditing] = useState<Partial<Coupon> | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchPhone, setSearchPhone] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<Profile | null>(null);
  const [issueCouponId, setIssueCouponId] = useState('');
  const [issueMsg, setIssueMsg] = useState('');

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons((data as Coupon[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!editing || !editing.code || !editing.name) return;
    await supabase.from('coupons').insert({
      code: editing.code.toUpperCase(),
      name: editing.name,
      type: editing.type,
      value: editing.value,
      max_discount: editing.max_discount || null,
      min_price: editing.min_price || 0,
      usage_limit: editing.usage_limit || 1,
      valid_until: editing.valid_until || null,
      issued_reason: 'manual',
    });
    setEditing(null);
    load();
  }

  async function toggleActive(c: Coupon) {
    await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id);
    load();
  }

  async function remove(id: string) {
    if (!confirm('삭제하시겠습니까?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    load();
  }

  async function searchCustomer() {
    setIssueMsg('');
    setFoundCustomer(null);
    const { data } = await supabase.from('profiles').select('*').eq('phone', searchPhone).maybeSingle();
    if (!data) {
      setIssueMsg('해당 번호의 고객을 찾을 수 없습니다.');
      return;
    }
    setFoundCustomer(data as Profile);
  }

  async function issueCoupon() {
    if (!foundCustomer || !issueCouponId) return;
    const { error } = await supabase
      .from('user_coupons')
      .insert({ profile_id: foundCustomer.id, coupon_id: issueCouponId });
    setIssueMsg(
      error ? '발급 중 오류가 발생했습니다: ' + error.message : `${foundCustomer.name}님에게 쿠폰을 발급했습니다.`
    );
    if (!error) {
      setFoundCustomer(null);
      setSearchPhone('');
      setIssueCouponId('');
    }
  }

  return (
    <div>
      <Topbar title="쿠폰관리" />
      <div className="p-4 md:p-8">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setEditing(emptyCoupon())}>
            <Plus size={16} /> 쿠폰 발행
          </Button>
        </div>

        {editing && (
          <Card className="mt-4 border-safety/30">
            <CardBody className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>쿠폰명</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <Label>쿠폰 코드</Label>
                  <Input
                    className="font-mono"
                    value={editing.code}
                    onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                  />
                </div>
                <div>
                  <Label>할인 방식</Label>
                  <Select
                    value={editing.type}
                    onChange={(e) => setEditing({ ...editing, type: e.target.value as 'fixed' | 'percent' })}
                  >
                    <option value="fixed">정액 할인(원)</option>
                    <option value="percent">정률 할인(%)</option>
                  </Select>
                </div>
                <div>
                  <Label>할인 값</Label>
                  <Input
                    type="number"
                    value={editing.value}
                    onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>최소 주문금액</Label>
                  <Input
                    type="number"
                    value={editing.min_price}
                    onChange={(e) => setEditing({ ...editing, min_price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>총 사용 가능 횟수</Label>
                  <Input
                    type="number"
                    value={editing.usage_limit}
                    onChange={(e) => setEditing({ ...editing, usage_limit: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>유효기간 (선택)</Label>
                  <Input
                    type="date"
                    value={editing.valid_until?.slice(0, 10) || ''}
                    onChange={(e) => setEditing({ ...editing, valid_until: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={save}>
                  발행
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>
                  취소
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        <Card className="mt-4">
          <CardBody className="space-y-3">
            <Label>고객에게 개별 쿠폰 발급 (휴대폰 번호로 검색)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="01012345678"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
              />
              <Button variant="secondary" onClick={searchCustomer}>
                검색
              </Button>
            </div>
            {foundCustomer && (
              <div className="flex flex-wrap items-center gap-2 rounded bg-steel-50 px-4 py-3">
                <span className="text-sm">
                  {foundCustomer.name} ({maskPhone(foundCustomer.phone)})
                </span>
                <Select
                  className="w-auto flex-1"
                  value={issueCouponId}
                  onChange={(e) => setIssueCouponId(e.target.value)}
                >
                  <option value="">발급할 쿠폰 선택</option>
                  {coupons
                    .filter((c) => c.is_active)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (
                        {c.type === 'fixed' ? formatPrice(c.value) : `${c.value}%`})
                      </option>
                    ))}
                </Select>
                <Button size="sm" onClick={issueCoupon} disabled={!issueCouponId}>
                  발급
                </Button>
              </div>
            )}
            {issueMsg && <p className="text-xs font-semibold text-steel-500">{issueMsg}</p>}
          </CardBody>
        </Card>

        <Card className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[750px] text-sm">
            <thead>
              <tr className="border-b border-steel-100 text-left text-xs text-steel-500">
                <th className="px-4 py-3 font-semibold">코드</th>
                <th className="px-4 py-3 font-semibold">이름</th>
                <th className="px-4 py-3 font-semibold">할인</th>
                <th className="px-4 py-3 font-semibold">사용/한도</th>
                <th className="px-4 py-3 font-semibold">상태</th>
                <th className="px-4 py-3 font-semibold">관리</th>
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
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3">
                    {c.type === 'fixed' ? formatPrice(c.value) : `${c.value}%`}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {c.used_count} / {c.usage_limit}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-sm px-2 py-1 text-xs font-bold ${
                        c.is_active ? 'bg-done-light text-done' : 'bg-steel-100 text-steel-500'
                      }`}
                    >
                      {c.is_active ? '사용가능' : '중지'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(c)}
                        className="text-xs font-semibold text-steel-500 underline"
                      >
                        {c.is_active ? '중지' : '재개'}
                      </button>
                      <button onClick={() => remove(c.id)} className="text-steel-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
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
