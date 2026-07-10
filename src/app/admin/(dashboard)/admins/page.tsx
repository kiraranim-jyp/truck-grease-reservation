'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Topbar } from '@/components/admin/Topbar';
import { Card, CardBody } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Profile } from '@/lib/types';
import { maskPhone } from '@/lib/utils';

export default function AdminRolesPage() {
  const supabase = createClient();
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [found, setFound] = useState<Profile | null>(null);
  const [message, setMessage] = useState('');

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data: me } = await supabase.from('profiles').select('role').eq('id', userData.user.id).single();
    setIsSuperAdmin(me?.role === 'super_admin');

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'super_admin'])
      .order('created_at');
    setAdmins((data as Profile[]) || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function searchByPhone() {
    setMessage('');
    setFound(null);
    const { data } = await supabase.from('profiles').select('*').eq('phone', searchPhone).maybeSingle();
    if (!data) {
      setMessage('해당 번호의 사용자를 찾을 수 없습니다.');
      return;
    }
    setFound(data as Profile);
  }

  async function grantAdmin() {
    if (!found) return;
    await supabase.from('profiles').update({ role: 'admin' }).eq('id', found.id);
    setMessage(`${found.name}님에게 관리자 권한을 부여했습니다.`);
    setFound(null);
    setSearchPhone('');
    load();
  }

  async function revokeAdmin(id: string) {
    if (!confirm('관리자 권한을 해제하시겠습니까?')) return;
    await supabase.from('profiles').update({ role: 'customer' }).eq('id', id);
    load();
  }

  return (
    <div>
      <Topbar title="관리자 권한관리" />
      <div className="max-w-2xl p-4 md:p-8">
        {!isSuperAdmin && (
          <p className="mb-4 text-xs font-semibold text-warn">
            super_admin 권한이 있는 계정만 권한을 변경할 수 있습니다. (조회만 가능)
          </p>
        )}

        {isSuperAdmin && (
          <Card>
            <CardBody className="space-y-3">
              <Label>휴대폰 번호로 관리자 추가</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="+821012345678"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                />
                <Button variant="secondary" onClick={searchByPhone}>
                  검색
                </Button>
              </div>
              {found && (
                <div className="flex items-center justify-between rounded bg-steel-50 px-4 py-3">
                  <span className="text-sm">
                    {found.name} ({maskPhone(found.phone)})
                  </span>
                  <Button size="sm" onClick={grantAdmin}>
                    관리자로 지정
                  </Button>
                </div>
              )}
              {message && <p className="text-xs font-semibold text-steel-500">{message}</p>}
            </CardBody>
          </Card>
        )}

        <Card className="mt-4">
          <div className="divide-y divide-steel-50">
            {admins.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-semibold text-graphite-900">
                    {a.name}{' '}
                    <span className="ml-1 rounded-sm bg-graphite-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {a.role === 'super_admin' ? 'SUPER' : 'ADMIN'}
                    </span>
                  </p>
                  <p className="text-xs text-steel-400">{maskPhone(a.phone)}</p>
                </div>
                {isSuperAdmin && a.role !== 'super_admin' && (
                  <button
                    onClick={() => revokeAdmin(a.id)}
                    className="text-xs font-semibold text-red-500 underline"
                  >
                    권한 해제
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
