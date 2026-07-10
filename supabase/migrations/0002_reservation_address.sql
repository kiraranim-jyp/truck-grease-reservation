-- ============================================================
-- 예약 시 방문 주소 수집
-- 예약하기 화면에서 연락처(필수)와 함께 방문 주소를 받도록 변경하면서
-- reservations 테이블에 address 컬럼을 추가한다. 예약건마다 방문 장소가
-- 다를 수 있어 profiles가 아닌 reservations에 저장한다.
--
-- Supabase 대시보드 -> SQL Editor에서 이 파일을 한 번 실행하세요.
-- ============================================================

alter table reservations add column if not exists address text;
