-- Hardening from the 2026-10-31 security audit (run-1). Behaviour for ordinary use
-- is unchanged; each block closes a path a scripted client could take around the app.

-- 1. Trial start in backups is client-writable. A future value must never reach a
-- device, and a later push must not raise or clear an earlier start.
create or replace function public.clamp_backups_trial_started_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.trial_started_at is not null and new.trial_started_at > now() + interval '5 minutes' then
    new.trial_started_at := null;
  end if;
  if tg_op = 'UPDATE' and old.trial_started_at is not null then
    new.trial_started_at := least(old.trial_started_at, coalesce(new.trial_started_at, old.trial_started_at));
  end if;
  return new;
end;
$$;
revoke all on function public.clamp_backups_trial_started_at() from anon, authenticated, public;

drop trigger if exists backups_clamp_trial_started_at on public.backups;
create trigger backups_clamp_trial_started_at
before insert or update on public.backups
for each row execute function public.clamp_backups_trial_started_at();

-- 2. Chat messages: the server sets the time, and one member cannot flood a team.
create or replace function public.guard_team_message_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.created_at := now();
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

drop trigger if exists team_messages_guard_insert on public.team_messages;
create trigger team_messages_guard_insert
before insert on public.team_messages
for each row execute function public.guard_team_message_insert();

-- 3. Membership changes serialize on the team row (and on the caller for the
-- per-person cap), so concurrent joins cannot pass the caps and concurrent leaves
-- cannot strand a team without a leader.
create or replace function public.assert_team_room(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('team_room:' || p_user::text));
  if (select count(*) from public.team_members where user_id = p_user) >= 10 then raise exception 'TOO_MANY_TEAMS'; end if;
end;
$$;
revoke all on function public.assert_team_room(uuid) from anon, authenticated, public;

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
  select id into target from public.teams where invite_code = upper(btrim(p_code)) for update;
  if target is null then raise exception 'TEAM_NOT_FOUND'; end if;
  if exists (select 1 from public.team_members where user_id = caller and team_id = target) then raise exception 'ALREADY_IN_TEAM'; end if;
  perform public.assert_team_room(caller);
  if (select count(*) from public.team_members where team_id = target) >= 50 then raise exception 'TEAM_FULL'; end if;

  insert into public.team_members (user_id, team_id, display_name, role)
  values (caller, target, btrim(p_display_name), 'member');

  return target;
end;
$$;

create or replace function public.join_public_team(p_team_id uuid, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  perform 1 from public.teams where id = p_team_id and is_public for update;
  if not found then raise exception 'TEAM_NOT_FOUND'; end if;
  if exists (select 1 from public.team_members where user_id = caller and team_id = p_team_id) then raise exception 'ALREADY_IN_TEAM'; end if;
  perform public.assert_team_room(caller);
  if (select count(*) from public.team_members where team_id = p_team_id) >= 50 then raise exception 'TEAM_FULL'; end if;
  insert into public.team_members (user_id, team_id, display_name, role)
  values (caller, p_team_id, btrim(p_display_name), 'member');
  return p_team_id;
end;
$$;

-- Leaving never strands a team without a leader: the longest-standing member takes
-- over, and a team with nobody left is removed.
create or replace function public.leave_team(p_team_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  mine public.team_members%rowtype;
  successor uuid;
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  perform 1 from public.teams where id = p_team_id for update;
  select * into mine from public.team_members where user_id = caller and team_id = p_team_id;
  if not found then return; end if;

  delete from public.team_members where user_id = caller and team_id = p_team_id;

  if mine.role = 'leader' then
    select user_id into successor from public.team_members
    where team_id = p_team_id order by joined_at asc limit 1;
    if successor is null then
      delete from public.teams where id = p_team_id;
    else
      update public.team_members set role = 'leader' where user_id = successor and team_id = p_team_id;
      update public.teams set owner_id = successor where id = p_team_id;
    end if;
  end if;
end;
$$;

create or replace function public.remove_team_member(p_team_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  perform 1 from public.teams where id = p_team_id for update;
  if not exists (select 1 from public.team_members where user_id = caller and team_id = p_team_id and role = 'leader') then raise exception 'NOT_LEADER'; end if;
  if p_user_id = caller then raise exception 'USE_LEAVE_TEAM'; end if;
  delete from public.team_members where user_id = p_user_id and team_id = p_team_id;
end;
$$;

-- 4. Invite codes. Same six-character format (older app builds only accept six),
-- but drawn from a cryptographic source, rotatable by the leader, and wrong guesses
-- are limited. A miss returns null rather than raising, so the attempt is recorded
-- (an exception would roll the record back).
create or replace function public.new_team_invite_code()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  candidate text;
  bytes bytea;
begin
  loop
    bytes := uuid_send(gen_random_uuid());
    candidate := '';
    for i in 0..5 loop
      candidate := candidate || substr(alphabet, 1 + (get_byte(bytes, i) % length(alphabet)), 1);
    end loop;
    exit when not exists (select 1 from public.teams where invite_code = candidate);
  end loop;
  return candidate;
end;
$$;
revoke all on function public.new_team_invite_code() from anon, authenticated, public;

create table if not exists public.team_join_misses (
  user_id uuid not null references auth.users(id) on delete cascade,
  attempted_at timestamptz not null default now()
);
create index if not exists team_join_misses_user_time_idx on public.team_join_misses (user_id, attempted_at desc);
alter table public.team_join_misses enable row level security;
revoke all on table public.team_join_misses from anon, authenticated, public;

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

create or replace function public.rotate_team_invite_code(p_team_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  fresh text;
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  perform 1 from public.teams where id = p_team_id for update;
  if not exists (select 1 from public.team_members where user_id = caller and team_id = p_team_id and role = 'leader') then raise exception 'NOT_LEADER'; end if;
  fresh := public.new_team_invite_code();
  update public.teams set invite_code = fresh where id = p_team_id;
  return fresh;
end;
$$;
revoke all on function public.rotate_team_invite_code(uuid) from anon, public;
grant execute on function public.rotate_team_invite_code(uuid) to authenticated;

-- 5. Reports outlive the reported message. The report keeps a copy of what was
-- reported, taken by the database (never from the client), so deleting the message,
-- the account or the team cannot erase the moderation record.
alter table public.message_reports add column if not exists team_id uuid;
alter table public.message_reports add column if not exists author_id uuid;
alter table public.message_reports add column if not exists author_name text;
alter table public.message_reports add column if not exists message_body text;
alter table public.message_reports add column if not exists message_sent_at timestamptz;

update public.message_reports r
set team_id = m.team_id, author_id = m.user_id, author_name = m.display_name, message_body = m.body, message_sent_at = m.created_at
from public.team_messages m
where m.id = r.message_id and r.message_body is null;

alter table public.message_reports alter column message_id drop not null;
alter table public.message_reports drop constraint if exists message_reports_message_id_fkey;
alter table public.message_reports
  add constraint message_reports_message_id_fkey foreign key (message_id) references public.team_messages(id) on delete set null;

create or replace function public.snapshot_reported_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select m.team_id, m.user_id, m.display_name, m.body, m.created_at
  into new.team_id, new.author_id, new.author_name, new.message_body, new.message_sent_at
  from public.team_messages m
  where m.id = new.message_id;
  return new;
end;
$$;
revoke all on function public.snapshot_reported_message() from anon, authenticated, public;

drop trigger if exists message_reports_snapshot on public.message_reports;
create trigger message_reports_snapshot
before insert on public.message_reports
for each row execute function public.snapshot_reported_message();

create or replace view public.message_reports_review
with (security_invoker = false)
as
  select r.created_at as reported_at,
         t.name as team,
         r.author_name as author,
         r.message_body as message,
         r.message_sent_at as sent_at,
         r.reason,
         r.reporter_id,
         r.author_id,
         r.team_id,
         r.message_id,
         (r.message_id is null) as message_deleted
  from public.message_reports r
  left join public.teams t on t.id = r.team_id
  order by r.created_at desc;
revoke all on public.message_reports_review from anon, authenticated, public;

-- 6. Chat names come from the roster, not the client, so a member cannot post under
-- another member's name. Folded into the insert guard from block 2.
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

-- 7. Shared stats stay plausible, and the avatar bucket is private even if it existed
-- before the migration that created it.
create or replace function public.update_team_status(p_sessions integer, p_streak integer, p_status text, p_display_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  update public.team_members
  set sessions = least(greatest(0, p_sessions), 100000),
      streak = least(greatest(0, p_streak), 36500),
      status = case when p_status in ('green', 'amber', 'red') then p_status else 'unknown' end,
      display_name = coalesce(nullif(btrim(p_display_name), ''), display_name),
      updated_at = now()
  where user_id = caller;
end;
$$;

update storage.buckets set public = false where id = 'team-avatars' and public;
