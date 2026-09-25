-- Leaving: anonymous reasons + a goodbye email, in the same step as the account deletion (run once in the SQL editor; safe to run again).
-- Before it: (1) Database -> Extensions -> enable pg_net (the line below does the same);
--            (2) store the Resend API key in Vault once:  select vault.create_secret('re_...', 'resend_api_key');
-- Without the key the deletion still works, only the goodbye email is skipped.
create extension if not exists pg_net;

-- reasons people give when they delete their account; no user id, no name, no email
create table if not exists public.leave_feedback (
  id      bigint generated always as identity primary key,
  at      timestamptz not null default now(),
  reasons text[] not null default '{}',
  note    text
);
alter table public.leave_feedback enable row level security;
drop policy if exists leave_feedback_staff on public.leave_feedback;
create policy leave_feedback_staff on public.leave_feedback for select using (public.is_teacher());
-- no insert policy: rows arrive only through delete_my_account()

drop function if exists public.delete_my_account();
create or replace function public.delete_my_account(p_reasons text[] default '{}', p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  v_email text; v_first text; v_key text; v_hi text;
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  if exists (select 1 from public.profiles where id = uid and role = 'teacher') then
    raise exception 'staff accounts are not deleted from the site';
  end if;
  select email into v_email from auth.users where id = uid;
  select first_name into v_first from public.profiles where id = uid;

  insert into public.leave_feedback (reasons, note)
  values (array(select r from unnest(coalesce(p_reasons, '{}'::text[])) as r where r in ('content','easy','hard','done','tech','other')),
          nullif(left(trim(coalesce(p_note, '')), 1000), ''));

  -- goodbye email through Resend (sent by pg_net after the commit); a problem here never blocks the deletion
  begin
    select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
    if v_key is not null and v_email is not null then
      v_hi := case when coalesce(v_first, '') <> ''
                   then 'היי ' || replace(replace(replace(v_first, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || ', '
                   else '' end;
      perform net.http_post(
        url     := 'https://api.resend.com/emails',
        headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
        body    := jsonb_build_object('from', 'RowdyQL <noreply@rowdyql.com>', 'to', v_email, 'subject', 'להתראות מ-RowdyQL',
                                      'html', replace($html$<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>RowdyQL</title>
</head>
<body style="margin:0;padding:0;background:#F4F7F6;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">החשבון נמחק. תודה שלמדתם איתנו.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F7F6;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#FFFFFF;border:1px solid #D5DEDB;border-radius:16px;overflow:hidden;">
    <tr><td align="center" bgcolor="#0B1416" style="background:#0B1416;padding:26px 24px;">
      <a href="https://rowdyql.com" style="text-decoration:none;"><img src="https://rowdyql.com/email-logo.png" width="240" alt="RowdyQL" style="display:block;border:0;width:240px;max-width:100%;height:auto;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;"></a>
    </td></tr>
    <tr><td dir="rtl" style="padding:32px 32px 6px;font-family:Arial,Helvetica,sans-serif;text-align:right;color:#15201E;">
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;">להתראות, ותודה</h1>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.65;color:#3D4B48;">{{hi}}החשבון שלכם ב-RowdyQL נמחק, יחד עם ההתקדמות וכל מה שנשמר בו.</p>
      <p style="margin:0;font-size:16px;line-height:1.65;color:#3D4B48;">תודה שלמדתם איתנו. אם תרצו לחזור, הדלת פתוחה: אפשר להירשם מחדש בכל רגע, גם עם אותו אימייל.</p>
    </td></tr>
    <tr><td align="center" style="padding:24px 32px 26px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#0E5566" style="border-radius:10px;">
        <a href="https://rowdyql.com" style="display:inline-block;padding:14px 30px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:10px;">RowdyQL</a>
      </td></tr></table>
    </td></tr>
    <tr><td dir="rtl" style="padding:0 32px 28px;font-family:Arial,Helvetica,sans-serif;text-align:right;">
      <p style="margin:0;font-size:13px;line-height:1.6;color:#93A5A1;">המייל הזה נשלח פעם אחת, כאישור למחיקה. לא יישלחו אליכם מיילים נוספים.</p>
    </td></tr>
    <tr><td align="center" bgcolor="#0B1416" style="background:#0B1416;padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#93A5A1;">
      RowdyQL &middot; <a href="https://rowdyql.com" style="color:#5CC3D9;text-decoration:none;">rowdyql.com</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>$html$, '{{hi}}', v_hi)));
    end if;
  exception when others then
    null;
  end;

  delete from auth.users where id = uid;  -- profile, progress, events and notes follow (on delete cascade)
end;
$$;

revoke all on function public.delete_my_account(text[], text) from public;
revoke all on function public.delete_my_account(text[], text) from anon;
grant execute on function public.delete_my_account(text[], text) to authenticated;
