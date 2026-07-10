'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Topbar } from '@/components/admin/Topbar';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import type { OperatingSettings } from '@/lib/types';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<OperatingSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('operating_settings').select('*').eq('id', 1).single();
      setSettings(data as OperatingSettings);
    })();
  }, []);

  function toggleWeekday(day: number) {
    if (!settings) return;
    const set = new Set(settings.closed_weekdays);
    if (set.has(day)) set.delete(day);
    else set.add(day);
    setSettings({ ...settings, closed_weekdays: Array.from(set).sort() });
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    await supabase
      .from('operating_settings')
      .update({
        open_time: settings.open_time,
        close_time: settings.close_time,
        slot_minutes: settings.slot_minutes,
        max_concurrent_bays: settings.max_concurrent_bays,
        closed_weekdays: settings.closed_weekdays,
        auto_approve: settings.auto_approve,
      })
      .eq('id', 1);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings) return null;

  return (
    <div>
      <Topbar title="운영설정" />
      <div className="max-w-2xl p-4 md:p-8">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-bold uppercase tracking-wide text-steel-500">영업시간</h2>
          </CardHeader>
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>오픈 시간</Label>
              <Input
                type="time"
                value={settings.open_time.slice(0, 5)}
                onChange={(e) => setSettings({ ...settings, open_time: e.target.value })}
              />
            </div>
            <div>
              <Label>마감 시간</Label>
              <Input
                type="time"
                value={settings.close_time.slice(0, 5)}
                onChange={(e) => setSettings({ ...settings, close_time: e.target.value })}
              />
            </div>
            <div>
              <Label>예약 슬롯 단위(분)</Label>
              <Input
                type="number"
                value={settings.slot_minutes}
                onChange={(e) => setSettings({ ...settings, slot_minutes: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>동시 작업 가능 베이 수</Label>
              <Input
                type="number"
                value={settings.max_concurrent_bays}
                onChange={(e) => setSettings({ ...settings, max_concurrent_bays: Number(e.target.value) })}
              />
            </div>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <h2 className="text-sm font-bold uppercase tracking-wide text-steel-500">정기 휴무일</h2>
          </CardHeader>
          <CardBody>
            <div className="flex gap-2">
              {WEEKDAYS.map((label, i) => (
                <button
                  key={i}
                  onClick={() => toggleWeekday(i)}
                  className={`h-10 w-10 rounded-full text-sm font-bold transition-colors ${
                    settings.closed_weekdays.includes(i)
                      ? 'bg-red-500 text-white'
                      : 'bg-steel-50 text-steel-500 hover:bg-steel-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-steel-400">빨간색으로 표시된 요일은 예약을 받지 않습니다.</p>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <h2 className="text-sm font-bold uppercase tracking-wide text-steel-500">예약 승인</h2>
          </CardHeader>
          <CardBody>
            <label className="flex items-center gap-2 text-sm text-graphite-900">
              <input
                type="checkbox"
                checked={settings.auto_approve}
                onChange={(e) => setSettings({ ...settings, auto_approve: e.target.checked })}
              />
              예약 접수 시 자동 승인 (체크 해제 시 관리자가 직접 승인)
            </label>
          </CardBody>
        </Card>

        <div className="mt-5 flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? '저장 중...' : '설정 저장'}
          </Button>
          {saved && <span className="text-sm font-semibold text-done">저장되었습니다</span>}
        </div>
      </div>
    </div>
  );
}
