import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(value: number) {
  return value.toLocaleString('ko-KR') + '원';
}

export function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export function formatDateTime(dateStr: string, timeStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${y}.${m}.${d} ${timeStr.slice(0, 5)}`;
}

// 영업시간 + 슬롯 단위로 예약 가능 시간 목록 생성
export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  slotMinutes: number
): string[] {
  const slots: string[] = [];
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  let cursor = openH * 60 + openM;
  const end = closeH * 60 + closeM;
  while (cursor < end) {
    const h = Math.floor(cursor / 60);
    const m = cursor % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    cursor += slotMinutes;
  }
  return slots;
}

export function maskPhone(phone: string) {
  if (phone.length < 8) return phone;
  return phone.slice(0, 3) + '-****-' + phone.slice(-4);
}
