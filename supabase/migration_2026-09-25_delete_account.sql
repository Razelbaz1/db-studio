-- Self-service account deletion from the personal area (run once in the SQL editor; safe to run again).
-- A signed-in user can delete only their own account. Deleting the auth user removes the profile, progress,
-- visit events and staff notes about them, because those tables reference auth.users with ON DELETE CASCADE.
-- Staff (role = 'teacher') cannot delete themselves here, so the account that runs the dashboard is never lost by a click.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  if exists (select 1 from public.profiles where id = uid and role = 'teacher') then
    raise exception 'staff accounts are not deleted from the site';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;
