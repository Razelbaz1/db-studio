-- Getting to know you after the first sign-in (instead of during sign-up): studying now?, institution, year, goals, level.
-- Run once in the SQL editor; safe to run again.
alter table public.profiles add column if not exists studying     boolean;
alter table public.profiles add column if not exists institution  text;
alter table public.profiles add column if not exists level        smallint;
alter table public.profiles drop constraint if exists profiles_level_check;
alter table public.profiles add constraint profiles_level_check check (level between 1 and 5);
alter table public.profiles add column if not exists onboarded_at timestamptz;

-- the dashboard roster shows the new answers
drop view if exists public.staff_roster;
create view public.staff_roster with (security_invoker = true) as
  select p.id, p.email, p.full_name, p.first_name, p.last_name, p.birth_date, p.study_year, p.semester, p.goals, p.interests, p.created_at,
         (select count(*) from public.progress pr where pr.user_id = p.id) as progress_keys,
         (select max(updated_at) from public.progress pr where pr.user_id = p.id) as last_active,
         (select count(*) from public.events e where e.user_id = p.id and e.kind = 'visit') as visits,
         (select max(at) from public.events e where e.user_id = p.id and e.kind = 'visit') as last_visit,
         (select n.text from public.notes n where n.user_id = p.id) as note,
         p.status, p.status_note, p.status_at,
         p.studying, p.institution, p.level, p.onboarded_at
  from public.profiles p;
