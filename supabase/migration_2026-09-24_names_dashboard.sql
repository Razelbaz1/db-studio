-- RowdyQL migration 2026-09-24: first/last name, birth date, visit events, teacher notes, richer staff view
-- Run once in the Supabase SQL editor (safe to re-run).

alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name  text;
alter table public.profiles add column if not exists birth_date date;

-- ---------- events: one row per visit (and future kinds), written by the user, read by staff ----------
create table if not exists public.events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('visit','login','signup')),
  at         timestamptz not null default now(),
  meta       jsonb
);
create index if not exists events_user_at on public.events (user_id, at desc);
alter table public.events enable row level security;
drop policy if exists events_insert_own on public.events;
drop policy if exists events_select_own on public.events;
drop policy if exists events_select_staff on public.events;
create policy events_insert_own   on public.events for insert with check (user_id = auth.uid());
create policy events_select_own   on public.events for select using (user_id = auth.uid());
create policy events_select_staff on public.events for select using (public.is_teacher());

-- ---------- notes: one private teacher note per student ----------
create table if not exists public.notes (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  text       text not null default '',
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.notes enable row level security;
drop policy if exists notes_staff on public.notes;
create policy notes_staff on public.notes for all using (public.is_teacher()) with check (public.is_teacher());

-- ---------- sign-up trigger: names + birth date ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, email, full_name, first_name, last_name, birth_date, study_year, semester, goals, interests, consent_at, consent_version)
  values (
    new.id,
    new.email,
    coalesce(nullif(m->>'full_name',''), trim(coalesce(m->>'first_name','') || ' ' || coalesce(m->>'last_name','')), new.email),
    nullif(m->>'first_name',''),
    nullif(m->>'last_name',''),
    nullif(m->>'birth_date','')::date,
    nullif(m->>'study_year','')::smallint,
    nullif(m->>'semester',''),
    nullif(m->>'goals',''),
    nullif(m->>'interests',''),
    coalesce((m->>'consent_at')::timestamptz, now()),
    coalesce(m->>'consent_version', 'unknown')
  ) on conflict (id) do nothing;
  insert into public.events (user_id, kind) values (new.id, 'signup');
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- staff view: roster + activity summary ----------
drop view if exists public.staff_roster;
create view public.staff_roster with (security_invoker = true) as
  select p.id, p.email, p.full_name, p.first_name, p.last_name, p.birth_date, p.study_year, p.semester, p.goals, p.interests, p.created_at,
         (select count(*) from public.progress pr where pr.user_id = p.id) as progress_keys,
         (select max(updated_at) from public.progress pr where pr.user_id = p.id) as last_active,
         (select count(*) from public.events e where e.user_id = p.id and e.kind = 'visit') as visits,
         (select max(at) from public.events e where e.user_id = p.id and e.kind = 'visit') as last_visit,
         (select n.text from public.notes n where n.user_id = p.id) as note
  from public.profiles p;
