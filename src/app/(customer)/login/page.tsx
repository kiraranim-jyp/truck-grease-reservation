'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/reservations';

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
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

  async function loginWith(provider: 'kakao' | 'naver') {
    // 네이버는 Supabase 대시보드 > Authentication > Providers에서 활성화 필요
    await supabase.auth.signInWithOAuth({
      provider: provider as never,
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}` },
    });
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="font-display text-2xl font-bold text-graphite-900">로그인</h1>
      <p className="mt-1 text-sm text-steel-500">휴대폰 번호로 간편하게 로그인하세요</p>

      <Card className="mt-6">
        <CardBody className="space-y-4">
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
          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
        </CardBody>
      </Card>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-steel-100" />
        <span className="text-xs text-steel-400">또는</span>
        <div className="h-px flex-1 bg-steel-100" />
      </div>

      <div className="space-y-2.5">
        <button
          onClick={() => loginWith('kakao')}
          className="w-full rounded py-3 text-sm font-semibold text-[#3C1E1E]"
          style={{ backgroundColor: '#FEE500' }}
        >
          카카오로 시작하기
        </button>
        <button
          onClick={() => loginWith('naver')}
          className="w-full rounded py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: '#03C75A' }}
        >
          네이버로 시작하기
        </button>
      </div>

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
