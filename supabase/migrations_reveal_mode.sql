-- 공개 방식 선택 추가 (한 번만 실행)
-- days: 만난 날 + N일 뒤 / next_plan: 다음 만남 전날
alter table public.twoh_settings
  add column if not exists reveal_mode text not null default 'days' check (reveal_mode in ('days', 'next_plan'));
