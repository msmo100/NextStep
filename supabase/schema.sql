-- Databasschema för NextStep (Supabase/Postgres).
-- Körs EN gång i Supabases SQL-editor (Dashboard → SQL → New query) mot ett nytt
-- projekt. Det går bra att köra om (idempotent: "create ... if not exists").

-- ============================================================
-- Tabell: applications (jobbansökningarna)
-- ============================================================
create table if not exists public.applications (
  id               uuid primary key default gen_random_uuid(),                 -- unikt id, skapas automatiskt
  user_id          uuid not null references auth.users (id) on delete cascade, -- ägaren; raden tas bort om kontot tas bort
  job_title        text not null,
  company          text not null,
  location         text default '',
  status           text not null default 'to-apply',
  application_date date,
  notes            text default '',
  tags             text[] default '{}',          -- lista av taggar
  url              text,
  source_id        text,                          -- annonsens id om ansökan kom från en jobbsökning
  status_history   jsonb default '[]'::jsonb,     -- statusövergångarna sparas som JSON
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);


alter table public.applications enable row level security;

drop policy if exists "Users manage own applications" on public.applications;
create policy "Users manage own applications"
  on public.applications
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index på user_id gör det snabbt att hämta en användares ansökningar.
create index if not exists applications_user_id_idx on public.applications (user_id);

-- ============================================================
-- Tabell: saved_searches (sparade jobbsökningar)
-- ============================================================
create table if not exists public.saved_searches (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  query      text default '',
  filters    jsonb default '{}'::jsonb,     -- de valda filtren sparas som JSON
  created_at timestamptz not null default now()
);

-- Samma säkerhetsupplägg som för ansökningarna: RLS på + en "egna rader"-policy.
alter table public.saved_searches enable row level security;

drop policy if exists "Users manage own saved searches" on public.saved_searches;
create policy "Users manage own saved searches"
  on public.saved_searches
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists saved_searches_user_id_idx on public.saved_searches (user_id);
