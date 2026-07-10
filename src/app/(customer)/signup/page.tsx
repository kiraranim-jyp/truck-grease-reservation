'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<'phone' | 'email'>('phone');
  const [step, setStep] = useState<'form' | 'otp'>('form');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  const [agree, setAgree] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function validateBasics() {
    if (!name) {
      setError('이름을 입력해주세요.');
      return false;
    }
    if (!agree) {
      setError('필수 약관에 동의해주세요.');
      return false;
    }
    return true;
  }

  // --- 휴대폰 가입 ---
  async function submitPhoneForm() {
    if (!validateBasics()) return;
    if (phone.length < 9) {
      setError('휴대폰 번호를 확인해주세요.');
      return;
    }
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: normalizePhone(phone) });
    setLoading(false);
    if (error) {
      setError('인증번호 발송에 실패했습니다.');
      return;
    }
    setStep('otp');
  }

  async function verifyAndCreateProfileByPhone() {
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalizePhone(phone),
      token: otp,
      type: 'sms',
    });
    if (error || !data.user) {
      setLoading(false);
      setError('인증번호가 올바르지 않습니다.');
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name,
      phone: normalizePhone(phone),
      phone_verified: true,
      login_provider: 'phone',
      referred_by: referralCode || null,
      marketing_agree: marketing,
    });
    setLoading(false);
    if (profileError) {
      setError('프로필 생성 중 오류가 발생했습니다: ' + profileError.message);
      return;
    }
    router.push('/vehicles?welcome=1');
    router.refresh();
  }

  // --- 이메일 가입 ---
  async function submitEmailForm() {
    if (!validateBasics()) return;
    if (!email || password.length < 6) {
      setError('이메일과 6자 이상의 비밀번호를 입력해주세요.');
      return;
    }
    setError('');
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) {
      setLoading(false);
      setError(error?.message || '가입 중 오류가 발생했습니다.');
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name,
      phone: '', // 이메일 가입 시 연락처는 마이페이지에서 추가 입력 가능
      phone_verified: false,
      login_provider: 'email',
      referred_by: referralCode || null,
      marketing_agree: marketing,
    });
    setLoading(false);
    if (profileError) {
      setError('프로필 생성 중 오류가 발생했습니다: ' + profileError.message);
      return;
    }
    router.push('/vehicles?welcome=1');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="font-display text-2xl font-bold text-graphite-900">회원가입</h1>
      <p className="mt-1 text-sm text-steel-500">휴대폰 또는 이메일로 가입하세요</p>

      {step === 'form' && (
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
      )}

      <Card className="mt-4">
        <CardBody className="space-y-4">
          {step === 'form' ? (
            <>
              <div>
                <Label htmlFor="name">이름</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              {tab === 'phone' && (
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
                    <Label htmlFor="password">비밀번호 (6자 이상)</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="ref">추천인 코드 (선택)</Label>
                <Input
                  id="ref"
                  placeholder="추천인 코드가 있다면 입력하세요"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                />
              </div>
              <div className="space-y-2 pt-1">
                <label className="flex items-start gap-2 text-sm text-graphite-900">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-semibold text-safety">[필수]</span> 이용약관 및
                    개인정보처리방침에 동의합니다
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm text-graphite-900">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-semibold text-steel-500">[선택]</span> 이벤트 및 혜택
                    알림 수신에 동의합니다
                  </span>
                </label>
              </div>
              <Button
                className="w-full"
                onClick={tab === 'phone' ? submitPhoneForm : submitEmailForm}
                disabled={loading}
              >
                {loading ? '처리 중...' : tab === 'phone' ? '인증번호 받기' : '가입 완료'}
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
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={verifyAndCreateProfileByPhone} disabled={loading}>
                {loading ? '가입 중...' : '가입 완료'}
              </Button>
            </>
          )}
          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
        </CardBody>
      </Card>

      <p className="mt-6 text-center text-sm text-steel-500">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="font-semibold text-safety">
          로그인
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
