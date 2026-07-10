'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Event } from '@/lib/types';
import { X } from 'lucide-react';

const DISMISS_KEY = 'event-popup-dismissed-until';

export function EventPopup() {
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil && new Date(dismissedUntil) > new Date()) return;

    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);
    (async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', today)
        .gte('end_date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setEvent(data as Event | null);
    })();
  }, []);

  function close() {
    setEvent(null);
  }

  function dismissToday() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    localStorage.setItem(DISMISS_KEY, tomorrow.toISOString());
    setEvent(null);
  }

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-steel-100 px-4 py-3">
          <p className="font-display text-sm font-bold text-graphite-900">이벤트</p>
          <button onClick={close} aria-label="닫기" className="text-steel-400 hover:text-graphite-900">
            <X size={18} />
          </button>
        </div>
        {event.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.image_url} alt={event.title} className="w-full object-cover" />
        )}
        <div className="p-5">
          <p className="font-display text-lg font-bold text-graphite-900">{event.title}</p>
          {event.content && <p className="mt-2 whitespace-pre-line text-sm text-steel-600">{event.content}</p>}
        </div>
        <div className="flex gap-2 border-t border-steel-100 p-4">
          <button
            onClick={dismissToday}
            className="flex-1 rounded border border-steel-100 py-2.5 text-sm font-semibold text-steel-500"
          >
            오늘 하루 보지 않기
          </button>
          {event.link_url ? (
            <Link href={event.link_url} className="flex-1" onClick={close}>
              <span className="flex w-full items-center justify-center rounded bg-safety py-2.5 text-sm font-semibold text-white">
                자세히 보기
              </span>
            </Link>
          ) : (
            <button
              onClick={close}
              className="flex-1 rounded bg-safety py-2.5 text-sm font-semibold text-white"
            >
              확인
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
