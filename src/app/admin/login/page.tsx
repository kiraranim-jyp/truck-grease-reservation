'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';

export default function AdminLoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function login() {
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setLoading(false);
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();
    setLoading(false);
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      setError('관리자 권한이 없는 계정입니다.');
      await supabase.auth.signOut();
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-graphite-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 bg-safety" />
          <span className="font-display text-xl font-bold tracking-wide text-white">
            TRUCK GREASE ADMIN
          </span>
        </div>
        <Card>
          <CardBody className="space-y-4">
            <div>
              <Label htmlFor="email">관리자 이메일</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@truckgrease.com"
              />
            </div>
            <div>
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && login()}
              />
            </div>
            {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
            <Button className="w-full" onClick={login} disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </CardBody>
        </Card>
        <p className="mt-4 text-center text-xs text-steel-400">
          관리자 계정은 Supabase 대시보드 또는 최초 super_admin이 발급합니다.
        </p>
      </div>
    </div>
  );
}
