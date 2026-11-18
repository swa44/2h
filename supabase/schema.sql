-- 우리의 기록 · Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 실행하세요.
-- 같은 프로젝트의 다른 앱 테이블과 겹치지 않도록 모든 이름에 twoh_ 접두사를 씁니다.

-- ─────────────────────────────────────────────
-- 설정 (사귄 날, 애칭) — 사용자당 1행
-- ─────────────────────────────────────────────
create table if not exists public.twoh_settings (
  user_id      uuid primary key default auth.uid() references auth.users on delete cascade,
  partner_name text,
  start_date   date,
  updated_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 만남 기록
-- ─────────────────────────────────────────────
create table if not exists public.twoh_meetings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  date       date not null,
  title      text,
  place      text,
  mood       text,
  letter     text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists twoh_meetings_user_date_idx on public.twoh_meetings (user_id, date desc);

-- ─────────────────────────────────────────────
-- 사진 (원본 압축본 + 썸네일 경로)
-- ─────────────────────────────────────────────
create table if not exists public.twoh_photos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  meeting_id uuid not null references public.twoh_meetings on delete cascade,
  path       text not null,
  thumb_path text not null,
  width      int,
  height     int,
  position   int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists twoh_photos_meeting_idx on public.twoh_photos (meeting_id, position);

-- ─────────────────────────────────────────────
-- 약속 (캘린더에 미리 표시해두는 만날 날)
-- ─────────────────────────────────────────────
create table if not exists public.twoh_plans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  date       date not null,
  memo       text,
  created_at timestamptz not null default now()
);
create index if not exists twoh_plans_user_date_idx on public.twoh_plans (user_id, date);

-- ─────────────────────────────────────────────
-- RLS: 본인 데이터만 읽고 쓰기
-- ─────────────────────────────────────────────
alter table public.twoh_settings enable row level security;
alter table public.twoh_meetings enable row level security;
alter table public.twoh_photos   enable row level security;
alter table public.twoh_plans    enable row level security;

drop policy if exists "twoh own settings" on public.twoh_settings;
create policy "twoh own settings" on public.twoh_settings
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "twoh own meetings" on public.twoh_meetings;
create policy "twoh own meetings" on public.twoh_meetings
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "twoh own photos" on public.twoh_photos;
create policy "twoh own photos" on public.twoh_photos
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "twoh own plans" on public.twoh_plans;
create policy "twoh own plans" on public.twoh_plans
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────
-- Storage: 비공개 버킷 'twoh-photos'
-- 경로 규칙: {user_id}/{meeting_id}/{파일명}
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('twoh-photos', 'twoh-photos', false)
on conflict (id) do nothing;

drop policy if exists "twoh photo objects select" on storage.objects;
create policy "twoh photo objects select" on storage.objects
  for select to authenticated
  using (bucket_id = 'twoh-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "twoh photo objects insert" on storage.objects;
create policy "twoh photo objects insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'twoh-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "twoh photo objects delete" on storage.objects;
create policy "twoh photo objects delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'twoh-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
