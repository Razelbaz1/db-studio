-- RowdyQL migration 2026-09-23: onboarding v2
-- No national ID. Year/semester optional. New free-text answers: goals, interests.
-- Run once in the Supabase SQL editor (safe to re-run).

alter table public.profiles alter column study_year drop not null;
alter table public.profiles alter column semester   drop not null;
alter table public.profiles add column if not exists goals     text;
alter table public.profiles add column if not exists interests text;

drop table if exists public.identities_private;

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

drop view if exists public.staff_roster;
create view public.staff_roster with (security_invoker = true) as
  select p.id, p.email, p.full_name, p.study_year, p.semester, p.goals, p.interests, p.created_at,
         (select count(*) from public.progress pr where pr.user_id = p.id) as progress_keys,
         (select max(updated_at) from public.progress pr where pr.user_id = p.id) as last_active
  from public.profiles p;
