'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Input';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Truck, Plus, Trash2 } from 'lucide-react';
import type { Vehicle } from '@/lib/types';

const VEHICLE_TYPES = ['1톤 트럭', '2.5톤 트럭', '5톤 카고', '8톤 카고', '11톤 카고', '25톤 덤프', '기타'];
const MANUFACTURERS = ['현대', '기아', '타타대우', '볼보', '스카니아', '벤츠', '기타'];

export default function VehiclesPage() {
  const supabase = createClient();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [plate, setPlate] = useState('');
  const [type, setType] = useState(VEHICLE_TYPES[0]);
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');

  async function load() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .eq('owner_id', userData.user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    setVehicles((data as Vehicle[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addVehicle() {
    if (!plate) {
      setError('차량번호를 입력해주세요.');
      return;
    }
    setSaving(true);
    setError('');
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { error } = await supabase.from('vehicles').insert({
      owner_id: userData.user.id,
      plate_number: plate,
      vehicle_type: type,
      manufacturer: manufacturer || null,
      model: model || null,
    });
    setSaving(false);
    if (error) {
      setError(
        error.code === '23505'
          ? '이미 등록된 차량번호입니다.'
          : '등록 중 오류가 발생했습니다: ' + error.message
      );
      return;
    }
    setPlate('');
    setManufacturer('');
    setModel('');
    setShowForm(false);
    load();
  }

  async function removeVehicle(id: string) {
    if (!confirm('이 차량을 삭제하시겠습니까?')) return;
    await supabase.from('vehicles').update({ is_active: false }).eq('id', id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-graphite-900">내 차량</h1>
          <p className="mt-1 text-sm text-steel-500">예약할 차량을 등록하고 관리하세요</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} size="sm">
          <Plus size={16} /> 차량 등록
        </Button>
      </div>

      {showForm && (
        <Card className="mt-4 border-safety/30">
          <CardHeader>
            <h2 className="font-semibold text-graphite-900">새 차량 등록</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>차량번호</Label>
                <Input
                  placeholder="12가 3456"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div>
                <Label>차종</Label>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>제조사 (선택)</Label>
                <Select value={manufacturer} onChange={(e) => setManufacturer(e.target.value)}>
                  <option value="">선택 안 함</option>
                  {MANUFACTURERS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>모델명 (선택)</Label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
            </div>
            {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
            <Button onClick={addVehicle} disabled={saving}>
              {saving ? '등록 중...' : '등록하기'}
            </Button>
          </CardBody>
        </Card>
      )}

      <div className="mt-5 space-y-3">
        {loading && <p className="text-sm text-steel-400">불러오는 중...</p>}
        {!loading && vehicles.length === 0 && (
          <Card>
            <CardBody className="flex flex-col items-center py-14 text-center">
              <Truck className="text-steel-400" size={36} />
              <p className="mt-3 font-semibold text-graphite-900">등록된 차량이 없어요</p>
              <p className="mt-1 text-sm text-steel-500">
                차량을 등록하면 바로 예약을 진행할 수 있습니다.
              </p>
            </CardBody>
          </Card>
        )}
        {vehicles.map((v) => (
          <Card key={v.id}>
            <CardBody className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded bg-graphite-900">
                  <Truck className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-mono text-base font-bold text-graphite-900">
                    {v.plate_number}
                  </p>
                  <p className="text-xs text-steel-500">
                    {v.vehicle_type}
                    {v.manufacturer ? ` · ${v.manufacturer}` : ''}
                    {v.model ? ` ${v.model}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeVehicle(v.id)}
                className="text-steel-400 hover:text-red-500"
                aria-label="차량 삭제"
              >
                <Trash2 size={18} />
              </button>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
