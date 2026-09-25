-- Live check in the sign-up wizard: is this email already registered? (run once in the SQL editor; safe to run again)
-- Returns only true/false, never any account data. Anyone can call it, which is what makes the live check possible.
create or replace function public.email_registered(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from auth.users where lower(email) = lower(trim(p_email)));
$$;

revoke all on function public.email_registered(text) from public;
grant execute on function public.email_registered(text) to anon, authenticated;
