'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Topbar } from '@/components/admin/Topbar';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import type { Event } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';

const emptyEvent = (): Partial<Event> => ({
  title: '',
  content: '',
  image_url: '',
  link_url: '',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date().toISOString().slice(0, 10),
  is_active: true,
});

export default function AdminEventsPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [editing, setEditing] = useState<Partial<Event> | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    setEvents((data as Event[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!editing || !editing.title || !editing.start_date || !editing.end_date) return;
    await supabase.from('events').insert({
      title: editing.title,
      content: editing.content || null,
      image_url: editing.image_url || null,
      link_url: editing.link_url || null,
      start_date: editing.start_date,
      end_date: editing.end_date,
    });
    setEditing(null);
    load();
  }

  async function toggleActive(e: Event) {
    await supabase.from('events').update({ is_active: !e.is_active }).eq('id', e.id);
    load();
  }

  async function remove(id: string) {
    if (!confirm('삭제하시겠습니까?')) return;
    await supabase.from('events').delete().eq('id', id);
    load();
  }

  return (
    <div>
      <Topbar title="이벤트관리" />
      <div className="p-4 md:p-8">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setEditing(emptyEvent())}>
            <Plus size={16} /> 이벤트 등록
          </Button>
        </div>

        {editing && (
          <Card className="mt-4 border-safety/30">
            <CardBody className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>제목</Label>
                  <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label>내용</Label>
                  <Input
                    value={editing.content || ''}
                    onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  />
                </div>
                <div>
                  <Label>이미지 URL (선택)</Label>
                  <Input
                    value={editing.image_url || ''}
                    onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>연결 링크 (선택)</Label>
                  <Input
                    value={editing.link_url || ''}
                    onChange={(e) => setEditing({ ...editing, link_url: e.target.value })}
                    placeholder="/signup?ref=... 또는 /reservations/new"
                  />
                </div>
                <div>
                  <Label>시작일</Label>
                  <Input
                    type="date"
                    value={editing.start_date}
                    onChange={(e) => setEditing({ ...editing, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>종료일</Label>
                  <Input
                    type="date"
                    value={editing.end_date}
                    onChange={(e) => setEditing({ ...editing, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={save}>
                  등록
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>
                  취소
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        <Card className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[750px] text-sm">
            <thead>
              <tr className="border-b border-steel-100 text-left text-xs text-steel-500">
                <th className="px-4 py-3 font-semibold">제목</th>
                <th className="px-4 py-3 font-semibold">기간</th>
                <th className="px-4 py-3 font-semibold">상태</th>
                <th className="px-4 py-3 font-semibold">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-50">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-steel-400">
                    불러오는 중...
                  </td>
                </tr>
              )}
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 font-semibold">{e.title}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {e.start_date.slice(0, 10)} ~ {e.end_date.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-sm px-2 py-1 text-xs font-bold ${
                        e.is_active ? 'bg-done-light text-done' : 'bg-steel-100 text-steel-500'
                      }`}
                    >
                      {e.is_active ? '노출중' : '중지'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(e)}
                        className="text-xs font-semibold text-steel-500 underline"
                      >
                        {e.is_active ? '중지' : '재개'}
                      </button>
                      <button onClick={() => remove(e.id)} className="text-steel-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
