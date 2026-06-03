-- NextStep database schema for Supabase (Postgres).
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query) once,
-- against a fresh project. Re-running is safe (idempotent).

-- ============================================================
-- Applications
-- ============================================================
create table if not exists public.applications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  job_title        text not null,
  company          text not null,
  location         text default '',
  status           text not null default 'to-apply',
  application_date date,
  notes            text default '',
  tags             text[] default '{}',
  url              text,
  source_id        text,
  status_history   jsonb default '[]'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.applications enable row level security;

-- Each user can only read/write their own rows.
drop policy if exists "Users manage own applications" on public.applications;
create policy "Users manage own applications"
  on public.applications
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists applications_user_id_idx on public.applications (user_id);

-- ============================================================
-- Saved searches
-- ============================================================
create table if not exists public.saved_searches (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  query      text default '',
  filters    jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.saved_searches enable row level security;

drop policy if exists "Users manage own saved searches" on public.saved_searches;
create policy "Users manage own saved searches"
  on public.saved_searches
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists saved_searches_user_id_idx on public.saved_searches (user_id);
