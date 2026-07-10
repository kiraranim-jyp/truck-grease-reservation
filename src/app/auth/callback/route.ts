import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect') || '/reservations';

  if (code) {
    const supabase = createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!profile) {
        // 최초 소셜 로그인 -> 프로필 미생성 상태, 추가정보 입력 페이지로 이동
        return NextResponse.redirect(`${origin}/signup/complete`);
      }
    }
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}
