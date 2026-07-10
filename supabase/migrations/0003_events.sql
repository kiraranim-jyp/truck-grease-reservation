-- ============================================================
-- 이벤트 공지 팝업
-- 홈 화면에서 기간 설정된 이벤트를 팝업으로 노출하기 위한 테이블.
-- 이미지는 파일 업로드 없이 이미 호스팅된 이미지의 URL을 입력하는 방식으로 둔다
-- (Storage 버킷 설정까지는 이번 스코프에 포함하지 않음).
--
-- Supabase 대시보드 -> SQL Editor에서 이 파일을 한 번 실행하세요.
-- ============================================================

create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text,
  image_url text,
  link_url text,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table events enable row level security;

create policy "이벤트 공개 조회" on events for select using (true);
create policy "이벤트 관리자 관리" on events for all using (is_admin()) with check (is_admin());
