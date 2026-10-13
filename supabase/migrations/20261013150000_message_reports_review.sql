-- What the app owner reads when a message is reported: the report next to the
-- message, its author and its team, newest first. Only the service role (the
-- dashboard's SQL editor and Table view) can see it; app users cannot.

create or replace view public.message_reports_review
with (security_invoker = false)
as
  select r.created_at as reported_at,
         t.name as team,
         m.display_name as author,
         m.body as message,
         m.created_at as sent_at,
         r.reason,
         r.reporter_id,
         m.user_id as author_id,
         m.team_id,
         m.id as message_id
  from public.message_reports r
  join public.team_messages m on m.id = r.message_id
  join public.teams t on t.id = m.team_id
  order by r.created_at desc;

revoke all on public.message_reports_review from anon, authenticated, public;
