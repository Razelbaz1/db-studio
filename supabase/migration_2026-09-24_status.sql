-- RowdyQL · account status: block / release a user from the teacher dashboard, with a private reason.
-- Run AFTER migration_2026-09-24_names_dashboard.sql (or run supabase/pending_2026-09-24.sql, which contains both).

-- ---------- columns ----------
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check check (status in ('active','blocked'));
alter table public.profiles add column if not exists status_note text;
alter table public.profiles add column if not exists status_at  timestamptz;

-- ---------- helpers ----------
create or replace function public.is_active()
returns boolean language sql stable security definer set search_path = public as
$$ select coalesce((select status = 'active' from public.profiles where id = auth.uid()), true) $$;

-- teachers only: set a user's status and the (private) reason
create or replace function public.set_user_status(uid uuid, new_status text, note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_teacher() then raise exception 'teachers only'; end if;
  if new_status not in ('active','blocked') then raise exception 'bad status'; end if;
  update public.profiles set status = new_status, status_note = nullif(trim(coalesce(note, '')), ''), status_at = now() where id = uid;
end $$;
revoke all on function public.set_user_status(uuid, text, text) from public;
grant execute on function public.set_user_status(uuid, text, text) to authenticated;

-- ---------- enforcement: a blocked account loses access to its data (the page also signs it out) ----------
drop policy if exists progress_own on public.progress;
create policy progress_own on public.progress for all
  using (user_id = auth.uid() and public.is_active())
  with check (user_id = auth.uid() and public.is_active());
drop policy if exists events_insert_own on public.events;
create policy events_insert_own on public.events for insert
  with check (user_id = auth.uid() and public.is_active());

-- ---------- roster shows the status ----------
drop view if exists public.staff_roster;
create view public.staff_roster with (security_invoker = true) as
  select p.id, p.email, p.full_name, p.first_name, p.last_name, p.birth_date, p.study_year, p.semester, p.goals, p.interests, p.created_at,
         (select count(*) from public.progress pr where pr.user_id = p.id) as progress_keys,
         (select max(updated_at) from public.progress pr where pr.user_id = p.id) as last_active,
         (select count(*) from public.events e where e.user_id = p.id and e.kind = 'visit') as visits,
         (select max(at) from public.events e where e.user_id = p.id and e.kind = 'visit') as last_visit,
         (select n.text from public.notes n where n.user_id = p.id) as note,
         p.status, p.status_note, p.status_at
  from public.profiles p;
