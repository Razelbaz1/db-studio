-- RowdyQL: database schema and security policies for Supabase (Postgres).
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent where possible).
-- Principles: every table has Row Level Security; students see only their own rows;
-- no national ID is stored; onboarding answers (year, semester, goals, interests) are optional;
-- the service_role key is never used by the page.

create extension if not exists pgcrypto;

-- ---------- profiles: one row per user, created automatically on sign-up ----------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text not null,
  study_year    smallint check (study_year between 1 and 7),
  semester      text check (semester in ('A','B')),
  goals         text,
  interests     text,
  role          text not null default 'student' check (role in ('student','teacher')),
  consent_at    timestamptz not null,
  consent_version text not null,
  created_at    timestamptz not null default now()
);

-- ---------- progress: per-user key/value documents (visited sections, quiz scores, exercise state) ----------
create table if not exists public.progress (
  user_id    uuid not null references auth.users(id) on delete cascade,
  key        text not null,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- ---------- helper: is the current user course staff? ----------
create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher');
$$;

-- ---------- trigger: copy sign-up metadata into profiles + identities_private, then scrub the ID from auth metadata ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, email, full_name, study_year, semester, goals, interests, consent_at, consent_version)
  values (
    new.id,
    new.email,
    coalesce(m->>'full_name', new.email),
    nullif(m->>'study_year','')::smallint,
    nullif(m->>'semester',''),
    nullif(m->>'goals',''),
    nullif(m->>'interests',''),
    coalesce((m->>'consent_at')::timestamptz, now()),
    coalesce(m->>'consent_version', 'unknown')
  ) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row Level Security ----------
alter table public.profiles           enable row level security;
alter table public.progress           enable row level security;

-- profiles: a user reads their own row; staff read all; a user may update their own name/year/semester but never their role
drop policy if exists profiles_select_own   on public.profiles;
drop policy if exists profiles_select_staff on public.profiles;
drop policy if exists profiles_update_own   on public.profiles;
create policy profiles_select_own   on public.profiles for select using (id = auth.uid());
create policy profiles_select_staff on public.profiles for select using (public.is_teacher());
create policy profiles_update_own   on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles p where p.id = auth.uid()));

-- progress: full access to own rows; staff read all
drop policy if exists progress_own         on public.progress;
drop policy if exists progress_select_staff on public.progress;
create policy progress_own          on public.progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy progress_select_staff on public.progress for select using (public.is_teacher());

-- ---------- staff view: roster with progress summary ----------
-- security_invoker makes the view obey the caller's RLS: a student sees only their own row, staff see everyone.
create view public.staff_roster with (security_invoker = true) as
  select p.id, p.email, p.full_name, p.study_year, p.semester, p.goals, p.interests, p.created_at,
         (select count(*) from public.progress pr where pr.user_id = p.id) as progress_keys,
         (select max(updated_at) from public.progress pr where pr.user_id = p.id) as last_active
  from public.profiles p;

-- ---------- how to make yourself the teacher (run once, replace the email) ----------
-- update public.profiles set role = 'teacher' where email = 'razelbaz1@gmail.com';

-- ---------- Supabase dashboard settings to apply by hand (not SQL) ----------
-- Authentication > Providers > Email: enable "Confirm email".
-- Authentication > URL configuration: Site URL = https://<your domain>/ ; add it to Redirect URLs.
-- Authentication > Attack protection: enable CAPTCHA (Cloudflare Turnstile) and keep rate limits on.
-- Project settings > API: never expose service_role; the page uses the anon key only.
-- Organization > Members: only you. Account: enable two-factor authentication.
