-- 공개까지 기다리는 날 설정 추가 (한 번만 실행)
alter table public.twoh_settings
  add column if not exists reveal_days int not null default 7 check (reveal_days between 0 and 365);
