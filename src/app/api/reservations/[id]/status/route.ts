import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendSms, TEMPLATES } from '@/lib/notifications/solapi';
import type { ReservationStatus } from '@/lib/types';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  }

  const body = await request.json();
  const { status, rejected_reason, admin_memo } = body as {
    status: ReservationStatus;
    rejected_reason?: string;
    admin_memo?: string;
  };

  const admin = createAdminClient();

  const { data: reservation, error: fetchError } = await admin
    .from('reservations')
    .select('*, customer:profiles(*), vehicle:vehicles(*), service:services(*)')
    .eq('id', params.id)
    .single();

  if (fetchError || !reservation) {
    return NextResponse.json({ error: '예약을 찾을 수 없습니다.' }, { status: 404 });
  }

  const updatePayload: Record<string, unknown> = { status };
  if (status === 'rejected') updatePayload.rejected_reason = rejected_reason || '사정에 의한 반려';
  if (admin_memo !== undefined) updatePayload.admin_memo = admin_memo;
  if (status === 'paid' && reservation.coupon_id) {
    // 쿠폰 사용 처리
    await admin
      .from('user_coupons')
      .update({ is_used: true, used_at: new Date().toISOString(), reservation_id: params.id })
      .eq('coupon_id', reservation.coupon_id)
      .eq('profile_id', reservation.customer_id);
    await admin.rpc('increment_coupon_usage', { coupon_id: reservation.coupon_id }).select();
  }

  const { error: updateError } = await admin
    .from('reservations')
    .update(updatePayload)
    .eq('id', params.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await admin.from('admin_audit_logs').insert({
    admin_id: user.id,
    action: `reservation_status_change:${status}`,
    target_table: 'reservations',
    target_id: params.id,
  });

  // 알림 발송 (실패해도 상태변경 자체는 성공 처리)
  try {
    const customerName = reservation.customer?.name || '고객';
    const phone = reservation.customer?.phone;
    const dateStr = reservation.reserved_date;
    const timeStr = reservation.reserved_time?.slice(0, 5);
    let text = '';
    if (status === 'approved') text = TEMPLATES.RESERVATION_APPROVED(customerName, dateStr, timeStr);
    if (status === 'rejected')
      text = TEMPLATES.RESERVATION_REJECTED(customerName, rejected_reason || '사정에 의한 반려');
    if (status === 'completed') text = TEMPLATES.SERVICE_COMPLETED(customerName);

    if (text && phone) {
      const result = await sendSms({ to: phone, text });
      await admin.from('notification_logs').insert({
        profile_id: reservation.customer_id,
        reservation_id: params.id,
        channel: 'sms',
        template_key: status,
        target_phone: phone,
        content: text,
        status: result.ok ? 'sent' : 'failed',
        provider_response: result.data,
      });
    }
  } catch (e) {
    // 알림 실패는 무시하고 계속 진행
  }

  return NextResponse.json({ ok: true });
}
