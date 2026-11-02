-- Security audit run-4 hardening (2026-11-02). Each block is safe to re-run.

-- 1. The avatar bucket keeps its 1 MB / JPEG-only limits even if it existed before the
-- migration that created it (that insert is `on conflict do nothing`).
update storage.buckets
set public = false, file_size_limit = 1048576, allowed_mime_types = array['image/jpeg']
where id = 'team-avatars';

-- 2. A report outlives the reporter's account, as it already outlives the message and
-- its author. The reporter id is cleared, not the moderation record.
alter table public.message_reports alter column reporter_id drop not null;
alter table public.message_reports drop constraint if exists message_reports_reporter_id_fkey;
alter table public.message_reports
  add constraint message_reports_reporter_id_fkey
  foreign key (reporter_id) references auth.users(id) on delete set null;

-- 3. Wrong invite-code guesses are counted under a per-account lock, so a burst of
-- parallel requests cannot all pass the 20-per-hour check before any miss is recorded.
create or replace function public.join_team(p_code text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  target uuid;
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  perform pg_advisory_xact_lock(hashtext('join_miss:' || caller::text));
  if (select count(*) from public.team_join_misses where user_id = caller and attempted_at > now() - interval '1 hour') >= 20 then
    raise exception 'RATE_LIMITED';
  end if;
  select id into target from public.teams where invite_code = upper(btrim(p_code)) for update;
  if target is null then
    delete from public.team_join_misses where user_id = caller and attempted_at < now() - interval '1 day';
    insert into public.team_join_misses (user_id) values (caller);
    return null;
  end if;
  if exists (select 1 from public.team_members where user_id = caller and team_id = target) then raise exception 'ALREADY_IN_TEAM'; end if;
  perform public.assert_team_room(caller);
  if (select count(*) from public.team_members where team_id = target) >= 50 then raise exception 'TEAM_FULL'; end if;

  insert into public.team_members (user_id, team_id, display_name, role)
  values (caller, target, btrim(p_display_name), 'member');

  return target;
end;
$$;
revoke all on function public.join_team(text, text) from anon, public;
grant execute on function public.join_team(text, text) to authenticated;

-- 4. Same for the chat limit: 30 messages a minute per member per team, counted under
-- a lock on that pair.
create or replace function public.guard_team_message_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.created_at := now();
  new.display_name := coalesce(
    (select m.display_name from public.team_members m where m.user_id = new.user_id and m.team_id = new.team_id),
    new.display_name
  );
  perform pg_advisory_xact_lock(hashtext('chat_rate:' || new.team_id::text || ':' || new.user_id::text));
  if (
    select count(*) from public.team_messages
    where team_id = new.team_id and user_id = new.user_id and created_at > now() - interval '1 minute'
  ) >= 30 then
    raise exception 'RATE_LIMITED';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_team_message_insert() from anon, authenticated, public;
