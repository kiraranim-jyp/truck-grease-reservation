import crypto from 'crypto';

const SOLAPI_BASE_URL = 'https://api.solapi.com';

function getAuthHeader() {
  const apiKey = process.env.SOLAPI_API_KEY!;
  const apiSecret = process.env.SOLAPI_API_SECRET!;
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString('hex');
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(date + salt)
    .digest('hex');
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

interface SendSmsParams {
  to: string;
  text: string;
}

/** 일반 SMS/LMS 발송 (Solapi) */
export async function sendSms({ to, text }: SendSmsParams) {
  const res = await fetch(`${SOLAPI_BASE_URL}/messages/v4/send`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        to: to.replace('+82', '0'),
        from: process.env.SOLAPI_SENDER_PHONE,
        text,
      },
    }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

interface SendKakaoParams {
  to: string;
  templateId: string;
  variables: Record<string, string>;
  fallbackText: string;
}

/** 카카오 알림톡 발송 (Solapi 카카오 채널 연동, 미승인/실패 시 SMS로 자동 대체) */
export async function sendKakaoAlimtalk({ to, templateId, variables, fallbackText }: SendKakaoParams) {
  const res = await fetch(`${SOLAPI_BASE_URL}/messages/v4/send`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        to: to.replace('+82', '0'),
        from: process.env.SOLAPI_SENDER_PHONE,
        kakaoOptions: {
          pfId: process.env.KAKAO_PF_ID,
          templateId,
          variables,
          disableSms: false, // 알림톡 실패 시 SMS 자동 대체 발송
        },
        text: fallbackText,
      },
    }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export const TEMPLATES = {
  RESERVATION_RECEIVED: (name: string, date: string, time: string) =>
    `[트럭그리스예약] ${name}님, 예약이 접수되었습니다. (${date} ${time}) 승인 결과를 곧 안내드릴게요.`,
  RESERVATION_APPROVED: (name: string, date: string, time: string) =>
    `[트럭그리스예약] ${name}님, 예약이 승인되었습니다. (${date} ${time}) 시간에 맞춰 방문해주세요.`,
  RESERVATION_REJECTED: (name: string, reason: string) =>
    `[트럭그리스예약] ${name}님, 예약이 반려되었습니다. 사유: ${reason}`,
  RESERVATION_REMINDER: (name: string, time: string) =>
    `[트럭그리스예약] ${name}님, 오늘 ${time}에 예약이 있습니다. 잊지 말고 방문해주세요!`,
  SERVICE_COMPLETED: (name: string) =>
    `[트럭그리스예약] ${name}님, 서비스가 완료되었습니다. 결제 후 이용해주셔서 감사합니다. 후기를 남겨주세요!`,
};
