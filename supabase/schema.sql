-- Supabase SQL Editor에서 한 번 실행하세요.
create table if not exists public.setuk_drafts (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  grade text not null,
  subject text not null,
  source_observation text not null,
  collected_notes text not null,
  draft_text text not null,
  reviewed_text text not null,
  review_notes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.setuk_drafts enable row level security;
create policy "authenticated users manage own drafts" on public.setuk_drafts
  for all to authenticated using (true) with check (true);
-- 데모용 익명 접속 정책입니다. 실제 운영에서는 Supabase Auth 정책으로 교체하세요.
create policy "anon demo read write" on public.setuk_drafts
  for all to anon using (true) with check (true);
