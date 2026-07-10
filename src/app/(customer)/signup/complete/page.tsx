'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';

export default function CompleteSignupPage() {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [provider, setProvider] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login');
        return;
      }
      setProvider(data.user.app_metadata?.provider || 'social');
      setName((data.user.user_metadata?.name as string) || '');
    });
  }, []);

  async function submit() {
    if (!name || phone.length < 9) {
      setError('이름과 휴대폰 번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase.from('profiles').insert({
      id: userData.user.id,
      name,
      phone,
      phone_verified: false,
      login_provider: provider,
    });
    setLoading(false);
    if (error) {
      setError('저장 중 오류: ' + error.message);
      return;
    }
    router.push('/vehicles?welcome=1');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="font-display text-2xl font-bold text-graphite-900">추가 정보 입력</h1>
      <p className="mt-1 text-sm text-steel-500">예약 안내를 위해 정보가 필요해요</p>
      <Card className="mt-6">
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="name">이름</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="phone">휴대폰 번호</Label>
            <Input
              id="phone"
              placeholder="010-1234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={submit} disabled={loading}>
            {loading ? '저장 중...' : '완료'}
          </Button>
          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
        </CardBody>
      </Card>
    </div>
  );
}
