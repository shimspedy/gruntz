-- Security audit run-8: fixes for the social layer added in 20261113120000.
--
-- 1. Findability is decided on the server. `upsert_athlete_profile` keeps the stored
--    flag when the app sends null, so a stale switch on another phone or in a restored
--    backup can no longer make an athlete findable again; `my_athlete_settings` lets
--    the app show what the server holds after sign-in.
-- 2. The hourly follow limit counts a ledger the caller cannot delete, so following and
--    unfollowing no longer resets it.
-- 3. Following and going private take the same lock on the target's card, so a follow
--    cannot land after the target went private.
-- 4. A report needs a reason before it is counted, and outlives either account.

-- ─── 1. Server-authoritative findability ────────────────────────────────────
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
  -- Same lock `follow_athlete` takes on its target: a follow either sees this change or waits for it.
  perform pg_advisory_xact_lock(hashtextextended('athlete_profile:' || caller::text, 0));
  -- null means "leave findability as it is": only the switch itself sends true or false.
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
    discoverable = coalesce(p_discoverable, p.discoverable),
    level = excluded.level,
    rank = excluded.rank,
    sessions = excluded.sessions,
    streak = excluded.streak,
    updated_at = now();
  -- Going private also drops the people following you: they agreed to follow a public card.
  if p_discoverable is false then
    delete from public.athlete_follows f where f.followee_id = caller;
  end if;
end;
$$;
revoke all on function public.upsert_athlete_profile(text, boolean, integer, integer, integer, text) from anon, public;
grant execute on function public.upsert_athlete_profile(text, boolean, integer, integer, integer, text) to authenticated;

-- What the server holds for the caller, so the switches in Settings show the truth after
-- a sign-in, on a second phone, or after a restore.
create or replace function public.my_athlete_settings()
returns table (discoverable boolean, following boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce((select p.discoverable from public.athlete_profiles p where p.user_id = (select auth.uid())), false),
    exists (select 1 from public.athlete_follows f where f.follower_id = (select auth.uid()));
$$;
revoke all on function public.my_athlete_settings() from anon, public;
grant execute on function public.my_athlete_settings() to authenticated;

-- ─── 2 and 3. Follow limit ledger, and a lock shared with going private ─────
-- One row per new follow. No app role can read or write it, and unfollowing does not
-- remove rows, so the hourly limit holds however the caller follows and unfollows.
create table if not exists public.athlete_follow_events (
  follower_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists athlete_follow_events_follower_idx on public.athlete_follow_events (follower_id, created_at desc);
alter table public.athlete_follow_events enable row level security;
revoke all on table public.athlete_follow_events from anon, authenticated, public;

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
  -- The target's card is locked before it is read, and `upsert_athlete_profile` takes the
  -- same lock: going private cannot slip between this check and the insert below.
  perform pg_advisory_xact_lock(hashtextextended('athlete_profile:' || p_user_id::text, 0));
  if not exists (select 1 from public.athlete_profiles p where p.user_id = p_user_id and p.discoverable)
     or public.athletes_blocked(caller, p_user_id) then raise exception 'NOT_FOUND'; end if;
  perform pg_advisory_xact_lock(hashtextextended('athlete_follow:' || caller::text, 0));
  if (select count(*) from public.athlete_follows f where f.follower_id = caller) >= 500 then raise exception 'TOO_MANY'; end if;
  if (select count(*) from public.athlete_follow_events e where e.follower_id = caller and e.created_at > now() - interval '1 hour') >= 60 then raise exception 'RATE_LIMITED'; end if;
  insert into public.athlete_follows (follower_id, followee_id) values (caller, p_user_id) on conflict do nothing;
  get diagnostics added = row_count;
  if added > 0 then
    insert into public.athlete_follow_events (follower_id) values (caller);
    delete from public.athlete_follow_events e where e.follower_id = caller and e.created_at < now() - interval '1 day';
  end if;
  return added > 0;
end;
$$;
revoke all on function public.follow_athlete(uuid) from anon, public;
grant execute on function public.follow_athlete(uuid) to authenticated;

-- ─── 4. Reports ─────────────────────────────────────────────────────────────
-- A report stays for review when either account is deleted, like a message report.
alter table public.athlete_reports alter column reporter_id drop not null;
alter table public.athlete_reports alter column reported_id drop not null;
alter table public.athlete_reports drop constraint if exists athlete_reports_reporter_id_fkey;
alter table public.athlete_reports drop constraint if exists athlete_reports_reported_id_fkey;
alter table public.athlete_reports add constraint athlete_reports_reporter_id_fkey foreign key (reporter_id) references auth.users(id) on delete set null;
alter table public.athlete_reports add constraint athlete_reports_reported_id_fkey foreign key (reported_id) references auth.users(id) on delete set null;

create or replace function public.report_athlete(p_user_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  shown text;
  why text := left(btrim(coalesce(p_reason, '')), 500);
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  if p_user_id is null or p_user_id = caller then raise exception 'INVALID_TARGET'; end if;
  -- Checked before anything else, so a request with no reason costs nothing and says nothing.
  if char_length(why) < 1 then raise exception 'INVALID_REASON'; end if;
  perform pg_advisory_xact_lock(hashtextextended('athlete_report:' || caller::text, 0));
  if (select count(*) from public.athlete_reports r where r.reporter_id = caller and r.created_at > now() - interval '1 day') >= 20 then raise exception 'RATE_LIMITED'; end if;
  -- The name is copied from the database as it stands now, never taken from the caller.
  -- Only athletes the caller could have seen can be reported: findable, followed, or following.
  select p.display_name into shown from public.athlete_profiles p
  where p.user_id = p_user_id
    and (p.discoverable
      or exists (select 1 from public.athlete_follows f where f.follower_id = caller and f.followee_id = p_user_id)
      or exists (select 1 from public.athlete_follows f where f.follower_id = p_user_id and f.followee_id = caller));
  if shown is null then raise exception 'NOT_FOUND'; end if;
  insert into public.athlete_reports (reporter_id, reported_id, reported_name, reason)
  values (caller, p_user_id, shown, why);
end;
$$;
revoke all on function public.report_athlete(uuid, text) from anon, public;
grant execute on function public.report_athlete(uuid, text) to authenticated;

-- ─── 5. A followers list has a ceiling ──────────────────────────────────────
-- Following is capped per follower, but nothing capped how many people follow one
-- athlete, so this list could grow without bound. Newest 500 by name order.
create or replace function public.list_followers()
returns setof public.athlete_card
language sql
stable
security definer
set search_path = ''
as $$
  select c.* from public.athlete_cards(array(
    select f.follower_id from public.athlete_follows f
    where f.followee_id = (select auth.uid())
    order by f.created_at desc
    limit 500
  )) c
  order by lower(c.display_name), c.user_id;
$$;
revoke all on function public.list_followers() from anon, public;
grant execute on function public.list_followers() to authenticated;
