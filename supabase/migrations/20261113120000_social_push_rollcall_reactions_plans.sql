-- Social layer, second pass: push notifications, roll call, a weekly leaderboard, chat
-- reactions, nudges, and plan follow counts.
--
-- Everything here is additive. Nothing a current app build reads or writes changes
-- shape: `update_team_status` keeps its signature, and the new columns have defaults.

-- ─── 1. Push tokens ─────────────────────────────────────────────────────────
-- One row per device. No app role can read this table: tokens are only ever read by
-- the `team-push` edge function with the service role, and written through the two
-- functions below, which take identity from the caller's own token.
create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  updated_at timestamptz not null default now(),
  constraint push_tokens_token_shape check (token ~ '^ExponentPushToken\[[A-Za-z0-9_-]{10,120}\]$'),
  constraint push_tokens_platform check (platform in ('ios', 'android'))
);
create index if not exists push_tokens_user_idx on public.push_tokens (user_id, updated_at desc);
alter table public.push_tokens enable row level security;
revoke all on table public.push_tokens from anon, authenticated, public;

create or replace function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  if p_token is null or p_token !~ '^ExponentPushToken\[[A-Za-z0-9_-]{10,120}\]$' then raise exception 'INVALID_TOKEN'; end if;
  if p_platform is null or p_platform not in ('ios', 'android') then raise exception 'INVALID_PLATFORM'; end if;
  -- A device belongs to whoever is signed in on it now: the token moves with the sign-in,
  -- so the previous account on this phone stops receiving through it.
  insert into public.push_tokens (token, user_id, platform, updated_at)
  values (p_token, caller, p_platform, now())
  on conflict (token) do update set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
  -- Five devices per account is plenty; older ones go.
  delete from public.push_tokens t
  where t.user_id = caller
    and t.token not in (
      select k.token from public.push_tokens k where k.user_id = caller order by k.updated_at desc, k.token limit 5
    );
end;
$$;
revoke all on function public.register_push_token(text, text) from anon, public;
grant execute on function public.register_push_token(text, text) to authenticated;

create or replace function public.unregister_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  delete from public.push_tokens where token = p_token and user_id = caller;
end;
$$;
revoke all on function public.unregister_push_token(text) from anon, public;
grant execute on function public.unregister_push_token(text) to authenticated;

-- A chat line is pushed once. The edge function claims it with the service role; no app
-- role can write this column (team_messages has no UPDATE grant).
alter table public.team_messages add column if not exists notified_at timestamptz;

-- ─── 2. Roll call and the weekly leaderboard ────────────────────────────────
alter table public.team_members add column if not exists last_trained_at timestamptz;
alter table public.team_members add column if not exists week_start date;
alter table public.team_members add column if not exists week_sessions integer not null default 0;
alter table public.team_members drop constraint if exists team_members_week_sessions_positive;
alter table public.team_members add constraint team_members_week_sessions_positive check (week_sessions >= 0 and week_sessions <= 100);

-- Same signature as before. A session count that went up by a believable amount since
-- the last report is a training day: it stamps `last_trained_at` and adds to this week's
-- count. A bigger jump is a first sync or a restore, and counts for neither, so joining a
-- team with 300 sessions of history does not read as 300 sessions this week.
create or replace function public.update_team_status(p_sessions integer, p_streak integer, p_status text, p_display_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  reported integer := least(greatest(0, coalesce(p_sessions, 0)), 100000);
  this_week date := (date_trunc('week', now() at time zone 'utc'))::date;
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  update public.team_members m
  set last_trained_at = case when reported - m.sessions between 1 and 5 then now() else m.last_trained_at end,
      week_sessions = least(100,
        (case when m.week_start = this_week then m.week_sessions else 0 end)
        + (case when reported - m.sessions between 1 and 5 then reported - m.sessions else 0 end)),
      week_start = this_week,
      sessions = reported,
      streak = least(greatest(0, coalesce(p_streak, 0)), 36500),
      status = case when p_status in ('green', 'amber', 'red') then p_status else 'unknown' end,
      display_name = coalesce(nullif(btrim(p_display_name), ''), m.display_name),
      updated_at = now()
  where m.user_id = caller;
end;
$$;
revoke all on function public.update_team_status(integer, integer, text, text) from anon, public;
grant execute on function public.update_team_status(integer, integer, text, text) to authenticated;

-- ─── 3. Nudges ──────────────────────────────────────────────────────────────
-- One per teammate per day, private teams only. The table is the limit; no app role
-- reads it.
create table if not exists public.team_nudges (
  team_id uuid not null references public.teams(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (team_id, sender_id, target_id, day)
);
create index if not exists team_nudges_sender_day_idx on public.team_nudges (sender_id, day);
create index if not exists team_nudges_target_idx on public.team_nudges (target_id);
alter table public.team_nudges enable row level security;
revoke all on table public.team_nudges from anon, authenticated, public;

-- True when this nudge is new today and may be delivered; false when it was already
-- sent. Raises when the two are not teammates in a private team.
create or replace function public.send_team_nudge(p_team_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  today date := (now() at time zone 'utc')::date;
  added integer;
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  if p_team_id is null or p_user_id is null or p_user_id = caller then raise exception 'INVALID_TARGET'; end if;
  if not exists (select 1 from public.teams t where t.id = p_team_id and t.is_public = false) then raise exception 'NOT_FOUND'; end if;
  if not exists (select 1 from public.team_members m where m.team_id = p_team_id and m.user_id = caller) then raise exception 'NOT_FOUND'; end if;
  if not exists (select 1 from public.team_members m where m.team_id = p_team_id and m.user_id = p_user_id) then raise exception 'NOT_FOUND'; end if;
  -- Serialise this sender's nudges so the daily ceiling cannot be raced.
  perform pg_advisory_xact_lock(hashtextextended('team_nudge:' || caller::text, 0));
  if (select count(*) from public.team_nudges n where n.sender_id = caller and n.day = today) >= 20 then raise exception 'RATE_LIMITED'; end if;
  insert into public.team_nudges (team_id, sender_id, target_id, day)
  values (p_team_id, caller, p_user_id, today)
  on conflict do nothing;
  get diagnostics added = row_count;
  delete from public.team_nudges n where n.sender_id = caller and n.day < today - 7;
  return added > 0;
end;
$$;
revoke all on function public.send_team_nudge(uuid, uuid) from anon, public;
grant execute on function public.send_team_nudge(uuid, uuid) to authenticated;

-- ─── 4. Chat reactions ──────────────────────────────────────────────────────
-- One kind of reaction, one per person per message, never on your own message.
create table if not exists public.team_message_reactions (
  message_id uuid not null references public.team_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);
create index if not exists team_message_reactions_user_idx on public.team_message_reactions (user_id);
alter table public.team_message_reactions enable row level security;
revoke all on table public.team_message_reactions from anon, authenticated, public;
grant select, insert, delete on table public.team_message_reactions to authenticated;

drop policy if exists "team_message_reactions_select_members" on public.team_message_reactions;
create policy "team_message_reactions_select_members"
on public.team_message_reactions for select
to authenticated
using (exists (
  select 1 from public.team_messages m
  where m.id = team_message_reactions.message_id and m.team_id in (select public.current_team_ids())
));

drop policy if exists "team_message_reactions_insert_members" on public.team_message_reactions;
create policy "team_message_reactions_insert_members"
on public.team_message_reactions for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.team_messages m
    where m.id = team_message_reactions.message_id
      and m.team_id in (select public.current_team_ids())
      and m.user_id <> (select auth.uid())
  )
);

drop policy if exists "team_message_reactions_delete_own" on public.team_message_reactions;
create policy "team_message_reactions_delete_own"
on public.team_message_reactions for delete
to authenticated
using (user_id = (select auth.uid()));

-- ─── 5. Plan follows ────────────────────────────────────────────────────────
-- Which plan a signed-in athlete is following, one row each, so plans can be ranked by
-- how many people are on them. An athlete can read and change only their own row; the
-- counts come from the function below and never name anyone.
create table if not exists public.plan_follows (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_id text not null,
  started_at timestamptz not null default now(),
  constraint plan_follows_plan_shape check (plan_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{1,119}$')
);
create index if not exists plan_follows_plan_idx on public.plan_follows (plan_id);
alter table public.plan_follows enable row level security;
revoke all on table public.plan_follows from anon, authenticated, public;
grant select, insert, update, delete on table public.plan_follows to authenticated;

drop policy if exists "plan_follows_select_own" on public.plan_follows;
create policy "plan_follows_select_own" on public.plan_follows for select to authenticated
using (user_id = (select auth.uid()));
drop policy if exists "plan_follows_insert_own" on public.plan_follows;
create policy "plan_follows_insert_own" on public.plan_follows for insert to authenticated
with check (user_id = (select auth.uid()));
drop policy if exists "plan_follows_update_own" on public.plan_follows;
create policy "plan_follows_update_own" on public.plan_follows for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "plan_follows_delete_own" on public.plan_follows;
create policy "plan_follows_delete_own" on public.plan_follows for delete to authenticated
using (user_id = (select auth.uid()));

-- Counts only, and only for plans with at least three followers: a count of one would
-- say what one particular person is training.
create or replace function public.plan_follower_counts()
returns table (plan_id text, followers bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select f.plan_id, count(*) as followers
  from public.plan_follows f
  group by f.plan_id
  having count(*) >= 3
  order by count(*) desc, f.plan_id
  limit 1000;
$$;
revoke all on function public.plan_follower_counts() from anon, public;
grant execute on function public.plan_follower_counts() to authenticated;

-- ─── 6. Athlete profiles and follows ────────────────────────────────────────
-- Following someone needs no code and no team. A profile is findable only after its
-- owner switches that on. No app role touches these tables directly: every read and
-- write goes through the functions below, which take identity from the caller's token
-- and apply blocks in both directions.
create table if not exists public.athlete_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  discoverable boolean not null default false,
  level integer not null default 1,
  rank text not null default 'Recruit',
  sessions integer not null default 0,
  streak integer not null default 0,
  week_start date,
  week_sessions integer not null default 0,
  last_trained_at timestamptz,
  avatar_version integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint athlete_profiles_name_length check (char_length(btrim(display_name)) between 1 and 40),
  constraint athlete_profiles_rank_length check (char_length(rank) between 1 and 20)
);
create index if not exists athlete_profiles_search_idx on public.athlete_profiles (lower(display_name) text_pattern_ops) where discoverable;
alter table public.athlete_profiles enable row level security;
revoke all on table public.athlete_profiles from anon, authenticated, public;

create table if not exists public.athlete_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followee_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  primary key (follower_id, followee_id),
  constraint athlete_follows_not_self check (follower_id <> followee_id)
);
create index if not exists athlete_follows_followee_idx on public.athlete_follows (followee_id);
alter table public.athlete_follows enable row level security;
revoke all on table public.athlete_follows from anon, authenticated, public;

-- One "started following you" push per pair, ever. Without this, following and
-- unfollowing the same athlete over and over would buzz their phone each time, because
-- every new follow row starts un-announced. Written only by the push function
-- (service role); no app role can read or write it.
create table if not exists public.athlete_follow_notices (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followee_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id)
);
create index if not exists athlete_follow_notices_followee_idx on public.athlete_follow_notices (followee_id);
alter table public.athlete_follow_notices enable row level security;
revoke all on table public.athlete_follow_notices from anon, authenticated, public;

create table if not exists public.athlete_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint athlete_blocks_not_self check (blocker_id <> blocked_id)
);
create index if not exists athlete_blocks_blocked_idx on public.athlete_blocks (blocked_id);
alter table public.athlete_blocks enable row level security;
revoke all on table public.athlete_blocks from anon, authenticated, public;

create table if not exists public.athlete_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_id uuid not null references auth.users(id) on delete cascade,
  reported_name text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint athlete_reports_reason_length check (char_length(btrim(reason)) between 1 and 500)
);
create index if not exists athlete_reports_reporter_idx on public.athlete_reports (reporter_id, created_at desc);
create index if not exists athlete_reports_reported_idx on public.athlete_reports (reported_id);
alter table public.athlete_reports enable row level security;
revoke all on table public.athlete_reports from anon, authenticated, public;

-- Whether either of two athletes has blocked the other.
create or replace function public.athletes_blocked(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.athlete_blocks b
    where (b.blocker_id = p_a and b.blocked_id = p_b) or (b.blocker_id = p_b and b.blocked_id = p_a)
  );
$$;
revoke all on function public.athletes_blocked(uuid, uuid) from anon, authenticated, public;

-- The caller's own card. Same training-day rule as the team roster.
create or replace function public.upsert_athlete_profile(p_display_name text, p_discoverable boolean, p_sessions integer, p_streak integer, p_level integer, p_rank text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  reported integer := least(greatest(0, coalesce(p_sessions, 0)), 100000);
  this_week date := (date_trunc('week', now() at time zone 'utc'))::date;
  name text := left(btrim(coalesce(p_display_name, '')), 40);
  rank_name text := case when p_rank in ('Recruit', 'Cadet', 'Operator', 'Veteran', 'Elite', 'Shadow', 'Apex') then p_rank else 'Recruit' end;
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  if char_length(name) < 1 then raise exception 'INVALID_NAME'; end if;
  insert into public.athlete_profiles as p (user_id, display_name, discoverable, level, rank, sessions, streak, week_start, week_sessions)
  values (caller, name, coalesce(p_discoverable, false), least(greatest(1, coalesce(p_level, 1)), 999), rank_name, reported,
          least(greatest(0, coalesce(p_streak, 0)), 36500), this_week, 0)
  on conflict (user_id) do update set
    last_trained_at = case when reported - p.sessions between 1 and 5 then now() else p.last_trained_at end,
    week_sessions = least(100,
      (case when p.week_start = this_week then p.week_sessions else 0 end)
      + (case when reported - p.sessions between 1 and 5 then reported - p.sessions else 0 end)),
    week_start = this_week,
    display_name = excluded.display_name,
    discoverable = excluded.discoverable,
    level = excluded.level,
    rank = excluded.rank,
    sessions = excluded.sessions,
    streak = excluded.streak,
    updated_at = now();
  -- Going private also drops the people following you: they agreed to follow a public card.
  if not coalesce(p_discoverable, false) then
    delete from public.athlete_follows f where f.followee_id = caller;
  end if;
end;
$$;
revoke all on function public.upsert_athlete_profile(text, boolean, integer, integer, integer, text) from anon, public;
grant execute on function public.upsert_athlete_profile(text, boolean, integer, integer, integer, text) to authenticated;

-- Keep the profile's photo version in step with the roster's.
create or replace function public.set_team_avatar_version(p_version integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  v integer := greatest(0, coalesce(p_version, 0));
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  update public.team_members set avatar_version = v where user_id = caller and avatar_version is distinct from v;
  update public.athlete_profiles set avatar_version = v where user_id = caller and avatar_version is distinct from v;
end;
$$;
revoke all on function public.set_team_avatar_version(integer) from anon, public;
grant execute on function public.set_team_avatar_version(integer) to authenticated;

-- One row shape for search, following and followers.
drop type if exists public.athlete_card cascade;
create type public.athlete_card as (
  user_id uuid, display_name text, level integer, rank text, sessions integer, streak integer,
  week_sessions integer, last_trained_at timestamptz, avatar_version integer, is_following boolean, follows_me boolean
);

create or replace function public.athlete_cards(p_ids uuid[])
returns setof public.athlete_card
language sql
stable
security definer
set search_path = ''
as $$
  select p.user_id, p.display_name, p.level, p.rank, p.sessions, p.streak,
    case when p.week_start = (date_trunc('week', now() at time zone 'utc'))::date then p.week_sessions else 0 end,
    p.last_trained_at, p.avatar_version,
    exists (select 1 from public.athlete_follows f where f.follower_id = (select auth.uid()) and f.followee_id = p.user_id),
    exists (select 1 from public.athlete_follows f where f.follower_id = p.user_id and f.followee_id = (select auth.uid()))
  from public.athlete_profiles p
  where p.user_id = any(p_ids)
    and p.user_id <> (select auth.uid())
    and not public.athletes_blocked((select auth.uid()), p.user_id);
$$;
revoke all on function public.athlete_cards(uuid[]) from anon, authenticated, public;

create or replace function public.search_athletes(p_query text)
returns setof public.athlete_card
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  -- Wildcards in the query are text, not patterns.
  needle text := lower(replace(replace(replace(btrim(coalesce(p_query, '')), '\', '\\'), '%', '\%'), '_', '\_'));
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  if char_length(needle) < 2 or char_length(needle) > 40 then return; end if;
  return query
    select c.* from public.athlete_cards(array(
      select p.user_id from public.athlete_profiles p
      where p.discoverable and lower(p.display_name) like needle || '%' escape '\'
      order by lower(p.display_name), p.user_id
      limit 30
    )) c
    order by lower(c.display_name), c.user_id;
end;
$$;
revoke all on function public.search_athletes(text) from anon, public;
grant execute on function public.search_athletes(text) to authenticated;

create or replace function public.list_following()
returns setof public.athlete_card
language sql
stable
security definer
set search_path = ''
as $$
  select c.* from public.athlete_cards(array(
    select f.followee_id from public.athlete_follows f where f.follower_id = (select auth.uid())
  )) c
  order by c.last_trained_at desc nulls last, lower(c.display_name);
$$;
revoke all on function public.list_following() from anon, public;
grant execute on function public.list_following() to authenticated;

create or replace function public.list_followers()
returns setof public.athlete_card
language sql
stable
security definer
set search_path = ''
as $$
  select c.* from public.athlete_cards(array(
    select f.follower_id from public.athlete_follows f where f.followee_id = (select auth.uid())
  )) c
  order by lower(c.display_name), c.user_id;
$$;
revoke all on function public.list_followers() from anon, public;
grant execute on function public.list_followers() to authenticated;

-- True when the follow is new. The target must be findable, and neither side blocked.
create or replace function public.follow_athlete(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  added integer;
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  if p_user_id is null or p_user_id = caller then raise exception 'INVALID_TARGET'; end if;
  if not exists (select 1 from public.athlete_profiles p where p.user_id = p_user_id and p.discoverable)
     or public.athletes_blocked(caller, p_user_id) then raise exception 'NOT_FOUND'; end if;
  perform pg_advisory_xact_lock(hashtextextended('athlete_follow:' || caller::text, 0));
  if (select count(*) from public.athlete_follows f where f.follower_id = caller) >= 500 then raise exception 'TOO_MANY'; end if;
  if (select count(*) from public.athlete_follows f where f.follower_id = caller and f.created_at > now() - interval '1 hour') >= 60 then raise exception 'RATE_LIMITED'; end if;
  insert into public.athlete_follows (follower_id, followee_id) values (caller, p_user_id) on conflict do nothing;
  get diagnostics added = row_count;
  return added > 0;
end;
$$;
revoke all on function public.follow_athlete(uuid) from anon, public;
grant execute on function public.follow_athlete(uuid) to authenticated;

create or replace function public.unfollow_athlete(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  delete from public.athlete_follows where follower_id = caller and followee_id = p_user_id;
end;
$$;
revoke all on function public.unfollow_athlete(uuid) from anon, public;
grant execute on function public.unfollow_athlete(uuid) to authenticated;

-- Blocking cuts both follows and hides each from the other everywhere above.
create or replace function public.block_athlete(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  if p_user_id is null or p_user_id = caller then raise exception 'INVALID_TARGET'; end if;
  if (select count(*) from public.athlete_blocks b where b.blocker_id = caller) >= 1000 then raise exception 'TOO_MANY'; end if;
  insert into public.athlete_blocks (blocker_id, blocked_id) values (caller, p_user_id) on conflict do nothing;
  delete from public.athlete_follows
  where (follower_id = caller and followee_id = p_user_id) or (follower_id = p_user_id and followee_id = caller);
end;
$$;
revoke all on function public.block_athlete(uuid) from anon, public;
grant execute on function public.block_athlete(uuid) to authenticated;

create or replace function public.report_athlete(p_user_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  shown text;
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  if p_user_id is null or p_user_id = caller then raise exception 'INVALID_TARGET'; end if;
  -- The name is copied from the database as it stands now, never taken from the caller.
  select p.display_name into shown from public.athlete_profiles p where p.user_id = p_user_id;
  if shown is null then raise exception 'NOT_FOUND'; end if;
  if (select count(*) from public.athlete_reports r where r.reporter_id = caller and r.created_at > now() - interval '1 day') >= 20 then raise exception 'RATE_LIMITED'; end if;
  insert into public.athlete_reports (reporter_id, reported_id, reported_name, reason)
  values (caller, p_user_id, shown, left(btrim(coalesce(p_reason, '')), 500));
end;
$$;
revoke all on function public.report_athlete(uuid, text) from anon, public;
grant execute on function public.report_athlete(uuid, text) to authenticated;

-- A findable athlete's photo, and the photo of anyone you follow, can be read like a
-- teammate's. The check runs as a definer function because no app role can read the
-- profile table.
create or replace function public.can_view_athlete_avatar(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.athlete_profiles p
    where p_name = p.user_id::text || '.jpg'
      and not public.athletes_blocked((select auth.uid()), p.user_id)
      and (p.discoverable or exists (
        select 1 from public.athlete_follows f where f.follower_id = (select auth.uid()) and f.followee_id = p.user_id
      ))
  );
$$;
revoke all on function public.can_view_athlete_avatar(text) from anon, public;
grant execute on function public.can_view_athlete_avatar(text) to authenticated;

drop policy if exists "team_avatars_select_athletes" on storage.objects;
create policy "team_avatars_select_athletes"
on storage.objects for select
to authenticated
using (bucket_id = 'team-avatars' and public.can_view_athlete_avatar(name));
