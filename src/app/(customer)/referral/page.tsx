'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Gift, Copy, Users } from 'lucide-react';
import type { Profile } from '@/lib/types';

export default function ReferralPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', userData.user.id).single();
      setProfile(data as Profile);

      const { count } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', userData.user.id);
      setReferralCount(count || 0);
    })();
  }, []);

  const link = profile
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${profile.referral_code}`
    : '';

  function copyLink() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mx-auto max-w-md py-2">
      <h1 className="font-display text-2xl font-bold text-graphite-900">친구초대</h1>
      <p className="mt-1 text-sm text-steel-500">친구를 초대하고 할인 쿠폰을 받아보세요</p>

      <Card className="mt-6 overflow-hidden">
        <div className="hazard-stripe h-2" />
        <CardBody className="text-center py-10">
          <Gift className="mx-auto text-safety" size={40} />
          <p className="mt-3 font-display text-lg font-bold text-graphite-900">
            초대한 친구가 가입하면
            <br />
            둘 다 할인쿠폰 지급!
          </p>
          <p className="mt-4 font-mono text-xs text-steel-400">MY CODE</p>
          <p className="font-mono text-2xl font-bold tracking-widest text-graphite-900">
            {profile?.referral_code || '------'}
          </p>
          <Button className="mt-5 w-full" onClick={copyLink}>
            <Copy size={16} /> {copied ? '복사되었습니다!' : '초대 링크 복사하기'}
          </Button>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-steel-50">
            <Users size={18} className="text-steel-500" />
          </div>
          <div>
            <p className="text-sm text-steel-500">지금까지 초대한 친구</p>
            <p className="font-display text-xl font-bold text-graphite-900">{referralCount}명</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
