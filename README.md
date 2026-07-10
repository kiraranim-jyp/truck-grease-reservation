# Truck Grease Reservation

화물차 그리스업 시간단위 예약 서비스 (Web / 모바일 반응형)

- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Backend**: Supabase (Auth, Postgres, Storage, Realtime)
- **Admin**: 동일 프로젝트 내 `/admin` 백오피스
- **알림**: Solapi (SMS / 카카오 알림톡)
- **배포**: Vercel

-----

## 1. 로컬 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기 (아래 2번 참고)
npm run dev
```

`http://localhost:3000` 접속 → 고객 화면
`http://localhost:3000/admin/login` → 관리자 화면

---

## 2. Supabase 설정

### 2-1. 프로젝트 생성 및 스키마 적용
1. https://supabase.com 에서 새 프로젝트 생성
2. Supabase 대시보드 → **SQL Editor** → `supabase/schema.sql` 내용 전체 실행
   - 테이블, RLS 정책, 트리거(추천인 쿠폰 자동지급 등), 초기 서비스 데이터가 한번에 생성됩니다.
3. **Project Settings → API**에서 값 복사 → `.env.local`에 입력
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API → service_role, **절대 클라이언트에 노출 금지**)

### 2-2. 휴대폰(SMS) 로그인
Supabase는 기본적으로 Twilio/Vonage/MessageBird 등을 SMS Provider로 지원합니다. Solapi를 사용하려면:
- **Authentication → Providers → Phone**을 활성화하고,
- **Authentication → Hooks → Send SMS Hook** (Supabase의 Auth Hooks 기능)에 Edge Function을 연결해 Solapi API로 실제 발송하도록 구성하세요.
- 또는 임시로 Twilio 체험 계정을 연결해 개발 단계에서 테스트할 수 있습니다.

### 2-3. 카카오 로그인
1. [Kakao Developers](https://developers.kakao.com)에서 애플리케이션 생성
2. Redirect URI: `https://<프로젝트>.supabase.co/auth/v1/callback`
3. Supabase 대시보드 → Authentication → Providers → Kakao 활성화 후 REST API 키/Client Secret 입력

### 2-4. 네이버 로그인
1. [네이버 개발자센터](https://developers.naver.com)에서 애플리케이션 등록
2. Supabase 대시보드 → Authentication → Providers → Naver 활성화 후 Client ID/Secret 입력
   (네이버는 Supabase의 커스텀 OAuth 설정 화면을 사용합니다. 최신 지원 여부는 Supabase 문서를 확인하세요.)

### 2-5. 최초 관리자(super_admin) 지정
회원가입 직후 프로필의 role은 기본값 `customer` 입니다. 최초 관리자는 SQL Editor에서 직접 승격합니다.

```sql
update profiles set role = 'super_admin' where phone = '+8210XXXXXXXX';
```

이후 `/admin/login`에서 로그인하려면 **이메일/비밀번호** 방식이 필요합니다. 관리자 전용 이메일 계정은
Supabase 대시보드 → Authentication → Users → **Add user**로 생성한 뒤, 위와 동일하게 해당 계정의
`profiles.role`을 `admin` 또는 `super_admin`으로 설정하세요.

---

## 3. Solapi (SMS / 카카오 알림톡) 설정

1. https://solapi.com 가입 → API Key/Secret 발급
2. 발신번호 사전 등록 (본인인증 필요)
3. `.env.local`에 입력:
   ```
   SOLAPI_API_KEY=
   SOLAPI_API_SECRET=
   SOLAPI_SENDER_PHONE=
   ```
4. 카카오 알림톡을 쓰려면 Solapi 콘솔에서 카카오 채널(플러스친구) 연동 및 템플릿 심사를 완료한 후
   `KAKAO_PF_ID`, 템플릿 ID를 `.env.local`에 입력하고 `src/lib/notifications/solapi.ts`의
   `sendKakaoAlimtalk` 호출부에 템플릿 ID를 연결하세요.
5. 알림 발송은 `src/app/api/reservations/[id]/status/route.ts`에서 예약 상태가
   승인/반려/완료로 바뀔 때 자동 호출됩니다.

---

## 4. Vercel 배포

### 방법 A — GitHub 연동 (권장)
1. 이 프로�트 폴더를 GitHub 저장소로 push
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Truck Grease Reservation"
   git branch -M main
   git remote add origin <YOUR_GITHUB_REPO_URL>
   git push -u origin main
   ```
2. https://vercel.com/new 에서 해당 저장소 Import
3. **Environment Variables**에 `.env.local`의 모든 값을 동일하게 입력
4. Deploy 클릭 → 완료되면 `https://<프로젝트명>.vercel.app` 도메인 발급

### 방법 B — Vercel CLI
```bash
npm i -g vercel
vercel login
vercel        # 개발 배포
vercel --prod # 프로덕션 배포
```
CLI 실행 중 환경변수를 입력하라는 안내가 나오며, 이후 `vercel env add`로 추가/수정 가능합니다.

배포 후 Supabase Authentication → URL Configuration에서 **Site URL**과
**Redirect URLs**에 실제 Vercel 도메인(`https://your-app.vercel.app/auth/callback`)을 등록해야
카카오/네이버 로그인이 정상 동작합니다.

---

## 5. 폴더 구조

```
src/
  app/
    page.tsx                     # 랜딩 페이지
    (customer)/                  # 고객 영역 (Navbar+BottomNav 레이아웃)
      login/  signup/  vehicles/
      reservations/  reservations/new/  reservations/[id]/  reservations/[id]/review/
      referral/  mypage/
    admin/
      login/                     # 관리자 로그인 (사이드바 없음)
      (dashboard)/               # 사이드바 포함 관리자 화면
        page.tsx                 # Dashboard
        reservations/  customers/  vehicles/  services/
        coupons/  settings/  stats/  admins/
    api/
      reservations/[id]/status/  # 예약 상태 변경 + 알림 발송
    auth/callback/                # OAuth 콜백 처리
  components/
    ui/                           # Button, Card, Input 등 공통 컴포넌트
    customer/                     # ReservationGauge(시그니처 요소), StatusBadge, Navbar
    admin/                        # Sidebar, Topbar
  lib/
    supabase/                     # client / server / admin 클라이언트
    notifications/solapi.ts       # SMS/알림톡 발송
    types.ts / utils.ts
supabase/
  schema.sql                      # 전체 DB 스키마 + RLS + 트리거 + 시드데이터
```

## 6. 예약 상태 플로우

```
예약(requested) → 승인대기(pending_approval) → 승인(approved)
  → 방문(visited) → 완료(completed) → 결제완료(paid)

(반려: rejected / 취소: cancelled 는 별도 종료 상태)
```

`operating_settings.auto_approve`를 켜면 예약 접수 시 자동 승인 로직을 앱단에서 추가로 구현할 수 있습니다
(현재는 관리자가 예약관리 화면에서 승인/반려를 수동 처리하는 구조입니다).

## 7. MVP 제외 범위
아래 기능은 이번 MVP에 포함되지 않았습니다 (요구사항 기준):
- 온라인 선결제 / 포인트 / 정기구독 / 기사 앱 / ERP 연동
