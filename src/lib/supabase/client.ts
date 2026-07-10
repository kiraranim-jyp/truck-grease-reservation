import { createBrowserClient } from '@supabase/ssr';

// 브라우저 클라이언트는 싱글턴으로 유지한다. 컴포넌트마다 새로 만들면
// GoTrueClient 인스턴스가 여러 개 생겨 세션 갱신 시 서로 락을 다투다가
// (Navigator Locks API) 타임아웃 예외가 발생할 수 있다 — 여러 화면을
// 동시에 오가며 인증 호출이 겹칠 때(Navbar + 페이지 자체 조회 등)
// "Application error" 크래시로 이어지는 경우가 여기 해당한다.
let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
