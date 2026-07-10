'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Topbar } from '@/components/admin/Topbar';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { formatPrice } from '@/lib/utils';
import type { Service } from '@/lib/types';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export default function AdminServicesPage() {
  const supabase = createClient();
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Partial<Service> | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('services').select('*').order('sort_order');
    setServices((data as Service[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startNew() {
    setEditing({ name: '', description: '', duration_minutes: 60, price: 0, sort_order: services.length + 1 });
  }

  async function save() {
    if (!editing || !editing.name) return;
    if (editing.id) {
      await supabase
        .from('services')
        .update({
          name: editing.name,
          description: editing.description,
          duration_minutes: editing.duration_minutes,
          price: editing.price,
          sort_order: editing.sort_order,
        })
        .eq('id', editing.id);
    } else {
      await supabase.from('services').insert({
        name: editing.name,
        description: editing.description,
        duration_minutes: editing.duration_minutes || 60,
        price: editing.price || 0,
        sort_order: editing.sort_order || 0,
      });
    }
    setEditing(null);
    load();
  }

  async function toggleActive(s: Service) {
    await supabase.from('services').update({ is_active: !s.is_active }).eq('id', s.id);
    load();
  }

  async function remove(id: string) {
    if (!confirm('삭제하시겠습니까?')) return;
    await supabase.from('services').delete().eq('id', id);
    load();
  }

  return (
    <div>
      <Topbar title="서비스관리" />
      <div className="p-4 md:p-8">
        <div className="flex justify-end">
          <Button size="sm" onClick={startNew}>
            <Plus size={16} /> 서비스 추가
          </Button>
        </div>

        {editing && (
          <Card className="mt-4 border-safety/30">
            <CardBody className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>서비스명</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <Label>가격(원)</Label>
                  <Input
                    type="number"
                    value={editing.price}
                    onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>소요시간(분)</Label>
                  <Input
                    type="number"
                    value={editing.duration_minutes}
                    onChange={(e) => setEditing({ ...editing, duration_minutes: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>정렬순서</Label>
                  <Input
                    type="number"
                    value={editing.sort_order}
                    onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label>설명</Label>
                <Input
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={save}>
                  저장
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>
                  취소
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        <div className="mt-4 space-y-3">
          {loading && <p className="text-sm text-steel-400">불러오는 중...</p>}
          {services.map((s) => (
            <Card key={s.id}>
              <CardBody className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-graphite-900">{s.name}</p>
                    <span
                      className={`rounded-sm px-2 py-0.5 text-[11px] font-bold ${
                        s.is_active ? 'bg-done-light text-done' : 'bg-steel-100 text-steel-500'
                      }`}
                    >
                      {s.is_active ? '노출중' : '숨김'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-steel-500">
                    {s.description} · 약 {s.duration_minutes}분
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-mono font-bold text-graphite-900">{formatPrice(s.price)}</p>
                  <button onClick={() => setEditing(s)} className="text-steel-400 hover:text-graphite-900">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => toggleActive(s)} className="text-xs font-semibold text-steel-500 underline">
                    {s.is_active ? '숨기기' : '노출'}
                  </button>
                  <button onClick={() => remove(s.id)} className="text-steel-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
