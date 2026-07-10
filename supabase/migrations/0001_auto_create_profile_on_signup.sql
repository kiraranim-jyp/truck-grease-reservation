-- ============================================================
-- 이메일 가입 시 profiles row가 자동 생성되지 않던 문제 수정
--
-- 증상: 이메일/비밀번호로 가입 후 인증까지 마쳐도 profiles row가 생기지 않아,
--       이후 차량 등록/예약 등 profiles(id)를 참조하는 모든 insert가
--       외래키 위반으로 실패함.
-- 원인: auth.users에 새 유저가 생겨도 profiles row를 만들어주는 트리거가
--       실제로는 존재하지 않았음(schema.sql에는 주석만 있었음).
--
-- Supabase 대시보드 -> SQL Editor에서 이 파일 전체를 한 번 실행하세요.
-- ============================================================

-- 1) 이메일 가입 시점에는 휴대폰 번호를 받지 않으므로 not null 제약 해제
alter table profiles alter column phone drop not null;

-- 2) auth.users insert 시 profiles row 자동 생성
create or replace function handle_new_user()
returns trigger as $$
declare
  v_referred_by text;
begin
  select referral_code into v_referred_by
  from profiles
  where referral_code = new.raw_user_meta_data->>'referred_by';

  insert into profiles (id, name, referred_by, marketing_agree)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    v_referred_by,
    coalesce((new.raw_user_meta_data->>'marketing_agree')::boolean, false)
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 3) 이미 가입했지만 profiles row가 없는 기존 계정 백필
insert into profiles (id, name, referred_by, marketing_agree)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'name', ''),
  (select p2.referral_code from profiles p2 where p2.referral_code = u.raw_user_meta_data->>'referred_by'),
  coalesce((u.raw_user_meta_data->>'marketing_agree')::boolean, false)
from auth.users u
left join profiles p on p.id = u.id
where p.id is null;
