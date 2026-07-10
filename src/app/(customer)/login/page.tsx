'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

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

  const [tab, setTab] = useState<'phone' | 'email'>('phone');

  // 휴대폰 로그인
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // 이메일 로그인
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendOtp() {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizePhone(phone),
    });
    setLoading(false);
    if (error) {
      setError('인증번호 발송에 실패했습니다. 번호를 확인해주세요.');
      return;
    }
    setOtpSent(true);
  }

  async function verifyOtp() {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: normalizePhone(phone),
      token: otp,
      type: 'sms',
    });
    setLoading(false);
    if (error) {
      setError('인증번호가 올바르지 않습니다.');
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  async function loginWithEmail() {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="font-display text-2xl font-bold text-graphite-900">로그인</h1>
      <p className="mt-1 text-sm text-steel-500">휴대폰 또는 이메일로 로그인하세요</p>

      <div className="mt-6 grid grid-cols-2 rounded border border-steel-100 bg-white p-1 text-sm font-semibold">
        <button
          onClick={() => {
            setTab('phone');
            setError('');
          }}
          className={cn(
            'rounded py-2 transition-colors',
            tab === 'phone' ? 'bg-graphite-900 text-white' : 'text-steel-500'
          )}
        >
          휴대폰
        </button>
        <button
          onClick={() => {
            setTab('email');
            setError('');
          }}
          className={cn(
            'rounded py-2 transition-colors',
            tab === 'email' ? 'bg-graphite-900 text-white' : 'text-steel-500'
          )}
        >
          이메일
        </button>
      </div>

      <Card className="mt-4">
        <CardBody className="space-y-4">
          {tab === 'phone' && (
            <>
              {!otpSent ? (
                <>
                  <div>
                    <Label htmlFor="phone">휴대폰 번호</Label>
                    <Input
                      id="phone"
                      inputMode="numeric"
                      placeholder="010-1234-5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={sendOtp} disabled={loading || phone.length < 9}>
                    {loading ? '발송 중...' : '인증번호 받기'}
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="otp">인증번호 6자리</Label>
                    <Input
                      id="otp"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={verifyOtp} disabled={loading || otp.length < 4}>
                    {loading ? '확인 중...' : '로그인'}
                  </Button>
                  <button
                    className="w-full text-center text-xs text-steel-400 underline"
                    onClick={() => setOtpSent(false)}
                  >
                    번호 다시 입력
                  </button>
                </>
              )}
            </>
          )}

          {tab === 'email' && (
            <>
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
            </>
          )}

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

function normalizePhone(phone: string) {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) return '+82' + digits.slice(1);
  return digits.startsWith('+') ? phone : '+82' + digits;
}
