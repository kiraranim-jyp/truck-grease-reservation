'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/reservations';

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loginWithEmail() {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(
        error.message.includes('Email not confirmed')
          ? '이메일 인증이 아직 완료되지 않았습니다. 받은 메일함을 확인해주세요.'
          : '이메일 또는 비밀번호가 올바르지 않습니다.'
      );
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="font-display text-2xl font-bold text-graphite-900">로그인</h1>
      <p className="mt-1 text-sm text-steel-500">이메일로 로그인하세요</p>

      <Card className="mt-6">
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loginWithEmail()}
            />
          </div>
          <Button className="w-full" onClick={loginWithEmail} disabled={loading || !email || !password}>
            {loading ? '확인 중...' : '로그인'}
          </Button>
          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
        </CardBody>
      </Card>

      <p className="mt-6 text-center text-sm text-steel-500">
        아직 회원이 아니신가요?{' '}
        <Link href="/signup" className="font-semibold text-safety">
          회원가입
        </Link>
      </p>
    </div>
  );
}
