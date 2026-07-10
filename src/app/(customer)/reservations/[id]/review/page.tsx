'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WriteReviewPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setSubmitting(true);
    setError('');
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase.from('reviews').insert({
      reservation_id: reservationId,
      customer_id: userData.user.id,
      rating,
      content: content || null,
    });
    setSubmitting(false);
    if (error) {
      setError('후기 등록 중 오류가 발생했습니다.');
      return;
    }
    router.push(`/reservations/${reservationId}`);
  }

  return (
    <div className="mx-auto max-w-md py-4">
      <h1 className="font-display text-2xl font-bold text-graphite-900">후기 작성</h1>
      <p className="mt-1 text-sm text-steel-500">서비스는 만족스러우셨나요?</p>

      <Card className="mt-5">
        <CardBody className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold text-steel-600">별점</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)}>
                  <Star
                    size={30}
                    className={cn(n <= rating ? 'fill-safety text-safety' : 'text-steel-100')}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-steel-600">내용</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="서비스는 어떠셨나요? 다른 이용자에게 도움이 되는 후기를 남겨주세요."
              className="w-full rounded border border-steel-300 px-3.5 py-2.5 text-sm focus:border-safety focus:ring-1 focus:ring-safety"
            />
          </div>
          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
          <Button className="w-full" onClick={submit} disabled={submitting}>
            {submitting ? '등록 중...' : '후기 등록'}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
