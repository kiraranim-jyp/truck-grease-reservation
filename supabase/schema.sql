-- ============================================================
-- Truck Grease Reservation - Supabase Schema
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- ENUM TYPES
-- ------------------------------------------------------------
create type user_role as enum ('customer', 'admin', 'super_admin');
create type reservation_status as enum (
  'requested',        -- 예약(요청)
  'pending_approval',  -- 승인대기
  'approved',          -- 승인
  'visited',           -- 방문
  'completed',         -- 완료
  'paid',              -- 결제완료
  'rejected',          -- 반려
  'cancelled'          -- 취소
);
create type coupon_type as enum ('percent', 'fixed');
create type notification_channel as enum ('sms', 'kakao');

-- ------------------------------------------------------------
-- PROFILES (auth.users 확장)
-- ------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  name text not null,
  phone text unique, -- 이메일 가입 시점에는 수집하지 않아 null 허용 (unique 제약은 null 여러 개를 허용)
  phone_verified boolean not null default false,
  login_provider text, -- 'phone' | 'kakao' | 'naver'
  referral_code text unique not null default substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8),
  referred_by text references profiles(referral_code),
  marketing_agree boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_phone on profiles(phone);
create index idx_profiles_referral_code on profiles(referral_code);

-- ------------------------------------------------------------
-- VEHICLES (차량)
-- ------------------------------------------------------------
create table vehicles (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  plate_number text not null,
  vehicle_type text not null, -- 예: 5톤 카고, 25톤 덤프 등
  manufacturer text,
  model text,
  year int,
  memo text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, plate_number)
);

create index idx_vehicles_owner on vehicles(owner_id);

-- ------------------------------------------------------------
-- SERVICES (서비스 항목 - 그리스업 종류, 소요시간, 가격)
-- ------------------------------------------------------------
create table services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  duration_minutes int not null default 60,
  price int not null default 0,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- EVENTS (홈 화면 이벤트 공지 팝업)
-- ------------------------------------------------------------
create table events (
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

-- ------------------------------------------------------------
-- OPERATING SETTINGS (운영설정: 영업시간, 슬롯 단위, 동시 수용 대수 등)
-- ------------------------------------------------------------
create table operating_settings (
  id int primary key default 1,
  open_time time not null default '08:00',
  close_time time not null default '18:00',
  slot_minutes int not null default 60,
  max_concurrent_bays int not null default 2, -- 동시 작업 가능 베이 수
  closed_weekdays int[] not null default array[0], -- 0=일요일 ... 6=토요일
  blocked_dates date[] not null default array[]::date[],
  auto_approve boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);
insert into operating_settings (id) values (1);

-- ------------------------------------------------------------
-- RESERVATIONS (예약)
-- ------------------------------------------------------------
create table reservations (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references profiles(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete restrict,
  service_id uuid not null references services(id) on delete restrict,
  reserved_date date not null,
  reserved_time time not null,
  status reservation_status not null default 'requested',
  price int not null default 0,
  coupon_id uuid, -- FK added below after coupons table is created
  discount_amount int not null default 0,
  final_price int not null default 0,
  address text, -- 방문(그리스업 작업) 주소, 예약마다 다를 수 있어 예약건별로 저장
  customer_memo text,
  admin_memo text,
  rejected_reason text,
  approved_at timestamptz,
  visited_at timestamptz,
  completed_at timestamptz,
  paid_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_reservations_customer on reservations(customer_id);
create index idx_reservations_date on reservations(reserved_date);
create index idx_reservations_status on reservations(status);

-- ------------------------------------------------------------
-- RESERVATION STATUS LOG (상태 변경 이력)
-- ------------------------------------------------------------
create table reservation_status_logs (
  id uuid primary key default uuid_generate_v4(),
  reservation_id uuid not null references reservations(id) on delete cascade,
  from_status reservation_status,
  to_status reservation_status not null,
  changed_by uuid references profiles(id),
  note text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- COUPONS (쿠폰 / 추천인)
-- ------------------------------------------------------------
create table coupons (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  name text not null,
  type coupon_type not null default 'fixed',
  value int not null, -- percent(1-100) or fixed amount(원)
  max_discount int, -- percent 쿠폰의 상한액
  min_price int not null default 0,
  issued_reason text, -- 'referral' | 'promotion' | 'manual'
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  usage_limit int not null default 1,
  used_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table reservations
  add constraint fk_reservations_coupon foreign key (coupon_id) references coupons(id);

-- ------------------------------------------------------------
-- USER COUPONS (사용자 보유 쿠폰)
-- ------------------------------------------------------------
create table user_coupons (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  coupon_id uuid not null references coupons(id) on delete cascade,
  is_used boolean not null default false,
  used_at timestamptz,
  reservation_id uuid references reservations(id),
  created_at timestamptz not null default now(),
  unique (profile_id, coupon_id)
);

-- ------------------------------------------------------------
-- REFERRALS (친구초대 트래킹)
-- ------------------------------------------------------------
create table referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid not null references profiles(id) on delete cascade,
  referred_id uuid not null references profiles(id) on delete cascade,
  reward_coupon_id uuid references coupons(id),
  rewarded boolean not null default false,
  created_at timestamptz not null default now(),
  unique (referred_id)
);

-- ------------------------------------------------------------
-- REVIEWS (후기)
-- ------------------------------------------------------------
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  reservation_id uuid not null unique references reservations(id) on delete cascade,
  customer_id uuid not null references profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  content text,
  photo_urls text[] default array[]::text[],
  admin_reply text,
  admin_replied_at timestamptz,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- NOTIFICATIONS LOG (SMS / 카카오 알림톡 발송이력)
-- ------------------------------------------------------------
create table notification_logs (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete set null,
  reservation_id uuid references reservations(id) on delete set null,
  channel notification_channel not null,
  template_key text not null,
  target_phone text not null,
  content text,
  status text not null default 'sent', -- sent | failed
  provider_response jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ADMIN AUDIT LOG (관리자 활동 로그)
-- ------------------------------------------------------------
create table admin_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references profiles(id),
  action text not null,
  target_table text,
  target_id text,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- updated_at 자동 갱신
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();
create trigger trg_vehicles_updated before update on vehicles
  for each row execute function set_updated_at();
create trigger trg_reservations_updated before update on reservations
  for each row execute function set_updated_at();

-- 예약 상태 변경 시 로그 기록 + 타임스탬프 자동 세팅
create or replace function log_reservation_status_change()
returns trigger as $$
begin
  if (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    insert into reservation_status_logs (reservation_id, from_status, to_status)
    values (new.id, old.status, new.status);

    if new.status = 'approved' then new.approved_at = now(); end if;
    if new.status = 'visited' then new.visited_at = now(); end if;
    if new.status = 'completed' then new.completed_at = now(); end if;
    if new.status = 'paid' then new.paid_at = now(); end if;
    if new.status = 'cancelled' then new.cancelled_at = now(); end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_reservation_status_log before update on reservations
  for each row execute function log_reservation_status_change();

-- ------------------------------------------------------------
-- 신규 가입 시 profiles row 자동 생성
-- auth.users에 새 유저가 생기면(이메일 가입 verifyOtp 완료 시점) signUp의
-- options.data(name, referred_by, marketing_agree)를 읽어 profiles row를 만든다.
-- referred_by는 존재하는 추천코드일 때만 채우고, 아니면 null 처리해 FK 위반으로
-- 가입 자체가 실패하지 않게 방어한다.
-- ------------------------------------------------------------
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ------------------------------------------------------------
-- 추천인 리워드 자동 지급
-- 신규 가입자가 referred_by(추천코드)를 가지고 있으면:
--   1) referrals 테이블에 관계 기록
--   2) 추천인/피추천인 모두에게 5,000원 할인 쿠폰 자동 발급
-- ------------------------------------------------------------
create or replace function grant_referral_reward()
returns trigger as $$
declare
  v_referrer_id uuid;
  v_coupon_id uuid;
begin
  if new.referred_by is null then
    return new;
  end if;

  select id into v_referrer_id from profiles where referral_code = new.referred_by;
  if v_referrer_id is null or v_referrer_id = new.id then
    return new;
  end if;

  insert into referrals (referrer_id, referred_id)
  values (v_referrer_id, new.id)
  on conflict (referred_id) do nothing;

  -- 이번 추천건 전용 쿠폰 생성 (1회용, 5,000원 할인) - 추천인/피추천인 각 1장
  insert into coupons (code, name, type, value, min_price, issued_reason, usage_limit)
  values (
    'REF-' || substr(replace(uuid_generate_v4()::text, '-', ''), 1, 10),
    '친구초대 감사 쿠폰',
    'fixed', 5000, 0, 'referral', 2
  )
  returning id into v_coupon_id;

  insert into user_coupons (profile_id, coupon_id) values (v_referrer_id, v_coupon_id);
  insert into user_coupons (profile_id, coupon_id) values (new.id, v_coupon_id);

  update referrals set reward_coupon_id = v_coupon_id, rewarded = true
  where referrer_id = v_referrer_id and referred_id = new.id;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_grant_referral_reward after insert on profiles
  for each row execute function grant_referral_reward();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table vehicles enable row level security;
alter table services enable row level security;
alter table operating_settings enable row level security;
alter table reservations enable row level security;
alter table reservation_status_logs enable row level security;
alter table coupons enable row level security;
alter table user_coupons enable row level security;
alter table referrals enable row level security;
alter table reviews enable row level security;
alter table notification_logs enable row level security;
alter table admin_audit_logs enable row level security;
alter table events enable row level security;

-- helper: 현재 사용자가 관리자인지
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$ language sql stable security definer;

-- 회원가입 폼에서 이메일 중복(인증 여부 무관) 여부를 확인하기 위한 함수
create or replace function email_exists(p_email text)
returns boolean as $$
  select exists (
    select 1 from auth.users where email = lower(p_email)
  );
$$ language sql stable security definer;

grant execute on function email_exists(text) to anon, authenticated;

-- profiles
create policy "본인 프로필 조회" on profiles for select using (id = auth.uid() or is_admin());
create policy "본인 프로필 수정" on profiles for update using (id = auth.uid() or is_admin());
create policy "회원가입 시 프로필 생성" on profiles for insert with check (id = auth.uid());

-- vehicles
create policy "본인 차량 조회" on vehicles for select using (owner_id = auth.uid() or is_admin());
create policy "본인 차량 등록" on vehicles for insert with check (owner_id = auth.uid());
create policy "본인 차량 수정" on vehicles for update using (owner_id = auth.uid() or is_admin());
create policy "본인 차량 삭제" on vehicles for delete using (owner_id = auth.uid() or is_admin());

-- services (전체 공개 조회, 관리자만 수정)
create policy "서비스 목록 공개 조회" on services for select using (true);
create policy "서비스 관리자 관리" on services for all using (is_admin()) with check (is_admin());

create policy "이벤트 공개 조회" on events for select using (true);
create policy "이벤트 관리자 관리" on events for all using (is_admin()) with check (is_admin());

-- operating_settings
create policy "운영설정 공개 조회" on operating_settings for select using (true);
create policy "운영설정 관리자 관리" on operating_settings for all using (is_admin()) with check (is_admin());

-- reservations
create policy "본인 예약 조회" on reservations for select using (customer_id = auth.uid() or is_admin());
create policy "본인 예약 생성" on reservations for insert with check (customer_id = auth.uid());
create policy "예약 수정" on reservations for update using (customer_id = auth.uid() or is_admin());

-- reservation_status_logs
create policy "예약 로그 조회" on reservation_status_logs for select using (
  is_admin() or exists (select 1 from reservations r where r.id = reservation_id and r.customer_id = auth.uid())
);

-- coupons (본인에게 발급된 쿠폰만, 관리자는 전체)
create policy "쿠폰 관리자 관리" on coupons for all using (is_admin()) with check (is_admin());
create policy "쿠폰 공개 조회(코드 검증용)" on coupons for select using (true);

-- user_coupons
create policy "본인 보유쿠폰 조회" on user_coupons for select using (profile_id = auth.uid() or is_admin());
create policy "본인 보유쿠폰 사용" on user_coupons for update using (profile_id = auth.uid() or is_admin());
create policy "쿠폰 발급" on user_coupons for insert with check (profile_id = auth.uid() or is_admin());

-- referrals
create policy "본인 추천 조회" on referrals for select using (referrer_id = auth.uid() or referred_id = auth.uid() or is_admin());
create policy "추천 생성" on referrals for insert with check (referred_id = auth.uid());

-- reviews
create policy "후기 공개 조회" on reviews for select using (is_visible = true or customer_id = auth.uid() or is_admin());
create policy "본인 후기 작성" on reviews for insert with check (customer_id = auth.uid());
create policy "본인 후기 수정" on reviews for update using (customer_id = auth.uid() or is_admin());

-- notification_logs (관리자만)
create policy "알림 로그 관리자 조회" on notification_logs for select using (is_admin());
create policy "알림 로그 시스템 기록" on notification_logs for insert with check (true);

-- admin_audit_logs (관리자만)
create policy "감사로그 관리자 조회" on admin_audit_logs for select using (is_admin());
create policy "감사로그 관리자 기록" on admin_audit_logs for insert with check (is_admin());

-- 쿠폰 사용 횟수 증가 (관리자 API에서 결제완료 처리 시 호출)
create or replace function increment_coupon_usage(coupon_id uuid)
returns void as $$
  update coupons set used_count = used_count + 1 where id = coupon_id;
$$ language sql security definer;

-- ============================================================
-- SEED DATA
-- ============================================================
insert into services (name, description, duration_minutes, price, sort_order) values
  ('일반 그리스업 (전체)', '차량 전체 하부 그리스 주입', 40, 30000, 1),
  ('부분 그리스업', '지정 부위만 그리스 주입', 20, 15000, 2),
  ('그리스업 + 하부점검', '그리스 주입 및 하부 부식/누유 점검', 60, 45000, 3);
