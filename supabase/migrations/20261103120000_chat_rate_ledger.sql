-- Security audit run-5 hardening (2026-11-03). Safe to re-run.

-- The chat limit (30 messages a minute per member per team) counted the member's
-- surviving rows, and the author delete policy lets a member delete their own rows at
-- any time. Thirty sends, one bulk delete, thirty more: the limit never fired. Sends
-- are now recorded in a ledger no app role can read or change, and counted there.
create table if not exists public.team_message_sends (
  team_id uuid not null,
  user_id uuid not null,
  sent_at timestamptz not null default now()
);
create index if not exists team_message_sends_idx
  on public.team_message_sends (team_id, user_id, sent_at desc);
alter table public.team_message_sends enable row level security;
revoke all on table public.team_message_sends from anon, authenticated, public;

-- Definer, so the trigger can write the ledger; the insert policy's WITH CHECK still
-- runs on the message row itself, and a rejected insert rolls the ledger row back.
create or replace function public.guard_team_message_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.created_at := now();
  new.display_name := coalesce(
    (select m.display_name from public.team_members m where m.user_id = new.user_id and m.team_id = new.team_id),
    new.display_name
  );
  perform pg_advisory_xact_lock(hashtext('chat_rate:' || new.team_id::text || ':' || new.user_id::text));
  delete from public.team_message_sends
  where team_id = new.team_id and user_id = new.user_id and sent_at < now() - interval '1 minute';
  if (
    select count(*) from public.team_message_sends
    where team_id = new.team_id and user_id = new.user_id and sent_at > now() - interval '1 minute'
  ) >= 30 then
    raise exception 'RATE_LIMITED';
  end if;
  insert into public.team_message_sends (team_id, user_id) values (new.team_id, new.user_id);
  return new;
end;
$$;
revoke all on function public.guard_team_message_insert() from anon, authenticated, public;
