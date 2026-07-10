'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

export default function SignupWelcomePage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace('/vehicles?welcome=1');
      router.refresh();
    }, 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <CheckCircle2 className="text-done" size={48} />
      <p className="mt-4 font-display text-xl font-bold text-graphite-900">
        회원가입이 완료되었습니다!
      </p>
      <p className="mt-1 text-sm text-steel-500">잠시 후 이동합니다...</p>
    </div>
  );
}
