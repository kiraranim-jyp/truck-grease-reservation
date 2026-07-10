'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { MailCheck, UserCheck } from 'lucide-react';

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

  const [step, setStep] = useState<'form' | 'verify' | 'exists'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  const [agree, setAgree] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendMsg, setResendMsg] = useState('');

  async function submitForm() {
    setError('');
    if (!name) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (!email || password.length < 6) {
      setError('이메일과 6자 이상의 비밀번호를 입력해주세요.');
      return;
    }
    if (!agree) {
      setError('필수 약관에 동의해주세요.');
      return;
    }
    setLoading(true);

    // 인증 완료 여부와 무관하게 auth.users에 이미 있는 이메일이면 바로 로그인으로 안내
    // (인증코드를 새로 보내는 대신, 실제 계정 테이블을 직접 확인해 정확히 판별)
    const { data: exists, error: existsError } = await supabase.rpc('email_exists', {
      p_email: email,
    });
    if (!existsError && exists) {
      setLoading(false);
      setStep('exists');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // 프로필 row는 DB 트리거(handle_new_user)가 auth.users 생성 즉시 자동으로 만듭니다.
        data: {
          name,
          referred_by: referralCode || null,
          marketing_agree: marketing,
        },
        // 메일 안의 인증 링크를 클릭했을 때도(다른 브라우저일 수 있음) 동일한
        // "가입 완료" 랜딩을 거쳐가도록 지정
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
          '/signup/welcome'
        )}`,
      },
    });
    setLoading(false);
    if (error) {
      if (error.message.includes('already registered')) {
        setStep('exists');
        return;
      }
      setError('가입 중 오류가 발생했습니다: ' + error.message);
      return;
    }
    // 이메일 인증이 이미 꺼져있는 프로젝트라면 signUp만으로 세션이 바로 생깁니다.
    if (data.session) {
      router.push('/signup/welcome');
      return;
    }
    // Supabase는 이미 가입(인증완료)된 이메일이어도 signUp을 에러 없이 성공 처리합니다
    // (이메일 존재 여부 노출 방지). 다만 이 경우 반환되는 user.identities가 빈 배열이라
    // 이걸로 "이미 가입된 이메일"인지 구분해 로그인으로 안내합니다.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setStep('exists');
      return;
    }
    setStep('verify');
  }

  async function verifyCode() {
    setError('');
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    });
    setLoading(false);
    if (error || !data.session) {
      setError('인증코드가 올바르지 않거나 만료되었습니다.');
      return;
    }
    router.push('/signup/welcome');
  }

  async function resendCode() {
    setResendMsg('');
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
          '/signup/welcome'
        )}`,
      },
    });
    setResendMsg(error ? '재발송에 실패했습니다.' : '인증코드를 다시 보냈습니다.');
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="font-display text-2xl font-bold text-graphite-900">회원가입</h1>
      <p className="mt-1 text-sm text-steel-500">이메일로 간편하게 가입하세요</p>

      <Card className="mt-6">
        <CardBody className="space-y-4">
          {step === 'exists' ? (
            <div className="flex flex-col items-center py-4 text-center">
              <UserCheck className="text-safety" size={32} />
              <p className="mt-3 text-sm font-semibold text-graphite-900">
                이미 가입한 이메일이 있습니다.
              </p>
              <p className="mt-1 text-xs text-steel-500">
                <span className="font-semibold">{email}</span>(으)로 로그인해주세요.
              </p>
              <Link href={`/login?email=${encodeURIComponent(email)}`} className="mt-5 w-full">
                <Button className="w-full">로그인하러 가기</Button>
              </Link>
            </div>
          ) : step === 'form' ? (
            <>
              <div>
                <Label htmlFor="name">이름</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
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
              <Button className="w-full" onClick={submitForm} disabled={loading}>
                {loading ? '처리 중...' : '인증코드 받기'}
              </Button>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center py-2 text-center">
                <MailCheck className="text-safety" size={32} />
                <p className="mt-3 text-sm text-graphite-900">
                  <span className="font-semibold">{email}</span> 로<br />
                  인증코드를 보내드렸습니다.
                </p>
                <p className="mt-1 text-xs text-steel-500">
                  메일에 있는 6자리 코드를 아래에 입력해주세요.
                </p>
                <p className="mt-1 text-xs text-steel-400">
                  이전에 가입을 시도했던 이메일이라면, 이번에 새로 받은 코드로 인증해주세요.
                </p>
              </div>
              <div>
                <Label htmlFor="otp">인증코드 6자리</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={verifyCode} disabled={loading || otp.length < 4}>
                {loading ? '확인 중...' : '인증 완료'}
              </Button>
              <button
                type="button"
                className="w-full text-center text-xs text-steel-400 underline"
                onClick={resendCode}
              >
                인증코드 다시 받기
              </button>
              {resendMsg && <p className="text-center text-xs text-steel-500">{resendMsg}</p>}
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
