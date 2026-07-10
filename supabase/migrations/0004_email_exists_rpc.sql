-- ============================================================
-- 회원가입 시 이메일 중복 여부를 클라이언트에서 확실하게 확인하기 위한 RPC
--
-- 기존에는 signUp() 응답의 identities 배열이 비어있는지로 "이미 가입된
-- 이메일"을 추정했는데, 이는 이메일 인증까지 완료된 계정에만 해당되고
-- 인증 전 상태로 남아있는 계정은 구분하지 못했다 (재가입 시 조용히 코드가
-- 재발송됨). auth.users 테이블을 직접 조회해 인증 여부와 무관하게
-- "이미 존재하는 이메일"을 정확히 판별한다.
--
-- Supabase 대시보드 -> SQL Editor에서 이 파일을 한 번 실행하세요.
-- ============================================================

create or replace function email_exists(p_email text)
returns boolean as $$
  select exists (
    select 1 from auth.users where email = lower(p_email)
  );
$$ language sql stable security definer;

-- 로그인 전 사용자(anon)도 회원가입 폼에서 호출해야 하므로 실행 권한 부여
grant execute on function email_exists(text) to anon, authenticated;
