-- Athlete profiles you can open: a bio, post / follower / following counts and the
-- athlete's posts, a Following-only feed, suggested athletes, and a flag on every feed
-- row saying whether its author can be followed (so the post can carry a Follow button).
--
-- Same rules as the rest of the social layer: definer functions only, identity from the
-- caller's token, blocks hide each side from the other, and nothing here reveals who
-- follows whom between two other athletes (counts only; lists stay the owner's own).

-- ─── Bio ────────────────────────────────────────────────────────────────────
alter table public.athlete_profiles add column if not exists bio text not null default '';
alter table public.athlete_profiles drop constraint if exists athlete_profiles_bio_length;
alter table public.athlete_profiles add constraint athlete_profiles_bio_length check (char_length(bio) <= 150);

-- A report keeps the bio as it stood, next to the name, so a reviewer sees what was reported.
alter table public.athlete_reports add column if not exists reported_bio text;

create or replace function public.set_athlete_bio(p_bio text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  -- At most two line breaks in a row, no surrounding space, 150 characters.
  clean text := left(btrim(regexp_replace(coalesce(p_bio, ''), E'(\\r?\\n){3,}', E'\n\n', 'g')), 150);
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  update public.athlete_profiles set bio = clean, updated_at = now() where user_id = caller;
  if not found then raise exception 'NO_PROFILE'; end if;
  return clean;
end;
$$;
revoke all on function public.set_athlete_bio(text) from anon, public;
grant execute on function public.set_athlete_bio(text) to authenticated;

create or replace function public.report_athlete(p_user_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  shown text;
  shown_bio text;
  why text := left(btrim(coalesce(p_reason, '')), 500);
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  if p_user_id is null or p_user_id = caller then raise exception 'INVALID_TARGET'; end if;
  if char_length(why) < 1 then raise exception 'INVALID_REASON'; end if;
  perform pg_advisory_xact_lock(hashtextextended('athlete_report:' || caller::text, 0));
  if (select count(*) from public.athlete_reports r where r.reporter_id = caller and r.created_at > now() - interval '1 day') >= 20 then raise exception 'RATE_LIMITED'; end if;
  -- Only athletes the caller could have seen: findable, followed, following, or the author
  -- of a post the caller may see (a profile now opens from any post).
  select p.display_name, p.bio into shown, shown_bio from public.athlete_profiles p
  where p.user_id = p_user_id
    and not public.athletes_blocked(caller, p_user_id)
    and (p.discoverable
      or exists (select 1 from public.athlete_follows f where f.follower_id = caller and f.followee_id = p_user_id)
      or exists (select 1 from public.athlete_follows f where f.follower_id = p_user_id and f.followee_id = caller)
      or exists (select 1 from public.feed_posts x where x.user_id = p_user_id and public.feed_can_view(caller, x.id)));
  if shown is null then raise exception 'NOT_FOUND'; end if;
  insert into public.athlete_reports (reporter_id, reported_id, reported_name, reported_bio, reason)
  values (caller, p_user_id, shown, nullif(shown_bio, ''), why);
end;
$$;
revoke all on function public.report_athlete(uuid, text) from anon, public;
grant execute on function public.report_athlete(uuid, text) to authenticated;

-- ─── The profile page ───────────────────────────────────────────────────────
-- One athlete as the caller may see them; null means the caller's own.
--
-- Who can open it: yourself; a findable athlete; anyone you follow or who follows you;
-- anyone who has a post you may see. Anyone else, and anyone across a block, is NOT_FOUND
-- (the same answer as an id that does not exist).
--
-- The training numbers and the counts are what a findable card already shows. For an
-- athlete who is not findable and has no follow with the caller, they come back null:
-- their posts make their name, level and rank public, nothing more.
create or replace function public.athlete_profile(p_user_id uuid)
returns table (
  user_id uuid, display_name text, level integer, rank text, bio text, avatar_version integer,
  sessions integer, streak integer, week_sessions integer, last_trained_at timestamptz,
  post_count integer, follower_count integer, following_count integer,
  is_me boolean, is_following boolean, follows_me boolean, followable boolean, discoverable boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  target uuid := coalesce(p_user_id, caller);
  me boolean;
  i_follow boolean;
  they_follow boolean;
  findable boolean;
  open_stats boolean;
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  me := target = caller;
  select p.discoverable into findable from public.athlete_profiles p where p.user_id = target;
  if findable is null then raise exception 'NOT_FOUND'; end if;
  if not me and public.athletes_blocked(caller, target) then raise exception 'NOT_FOUND'; end if;
  i_follow := exists (select 1 from public.athlete_follows f where f.follower_id = caller and f.followee_id = target);
  they_follow := exists (select 1 from public.athlete_follows f where f.follower_id = target and f.followee_id = caller);
  if not (me or findable or i_follow or they_follow
          or exists (select 1 from public.feed_posts x where x.user_id = target and public.feed_can_view(caller, x.id))) then
    raise exception 'NOT_FOUND';
  end if;
  open_stats := me or findable or i_follow or they_follow;
  return query
    select p.user_id, p.display_name, p.level, p.rank, p.bio,
      -- The photo is readable to the same people `can_view_athlete_avatar` lets through.
      case when me or findable or i_follow then p.avatar_version else 0 end,
      case when open_stats then p.sessions end,
      case when open_stats then p.streak end,
      case when open_stats then (case when p.week_start = (date_trunc('week', now() at time zone 'utc'))::date then p.week_sessions else 0 end) end,
      case when open_stats then p.last_trained_at end,
      (select count(*) from public.feed_posts x where x.user_id = target and public.feed_can_view(caller, x.id))::integer,
      case when open_stats then (select count(*) from public.athlete_follows f where f.followee_id = target
        and (me or not public.athletes_blocked(caller, f.follower_id)))::integer end,
      case when open_stats then (select count(*) from public.athlete_follows f where f.follower_id = target
        and (me or not public.athletes_blocked(caller, f.followee_id)))::integer end,
      me, i_follow, they_follow, (not me and findable), findable
    from public.athlete_profiles p
    where p.user_id = target;
end;
$$;
revoke all on function public.athlete_profile(uuid) from anon, public;
grant execute on function public.athlete_profile(uuid) to authenticated;

-- ─── Suggested athletes ─────────────────────────────────────────────────────
-- Findable athletes the caller does not follow yet. Ranked only on things the caller
-- already knows or that are public on a findable card: they follow you, you share a
-- team, they trained or posted lately. Never on who your follows follow, which would let
-- a caller read other athletes' follow lists out of the order.
create or replace function public.suggested_athletes()
returns table (
  user_id uuid, display_name text, level integer, rank text, sessions integer, streak integer,
  week_sessions integer, last_trained_at timestamptz, avatar_version integer, is_following boolean, follows_me boolean,
  reason text)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (select (select auth.uid()) as uid),
  pool as (
    select p.*,
      exists (select 1 from public.athlete_follows f, me where f.follower_id = p.user_id and f.followee_id = me.uid) as follows_me,
      exists (select 1 from public.team_members a join public.team_members b on b.team_id = a.team_id, me
              where a.user_id = me.uid and b.user_id = p.user_id) as teammate,
      exists (select 1 from public.feed_posts x where x.user_id = p.user_id and not x.hidden
              and x.audience = 'everyone' and x.created_at > now() - interval '14 days') as posted
    from public.athlete_profiles p, me
    where me.uid is not null
      and p.discoverable
      and p.user_id <> me.uid
      and not public.athletes_blocked(me.uid, p.user_id)
      and not exists (select 1 from public.athlete_follows f where f.follower_id = me.uid and f.followee_id = p.user_id)
    order by p.last_trained_at desc nulls last
    limit 300
  )
  select s.user_id, s.display_name, s.level, s.rank, s.sessions, s.streak,
    case when s.week_start = (date_trunc('week', now() at time zone 'utc'))::date then s.week_sessions else 0 end,
    s.last_trained_at, s.avatar_version, false, s.follows_me,
    case when s.follows_me then 'follows-you' when s.teammate then 'teammate'
         when s.last_trained_at > now() - interval '7 days' then 'active' else 'new' end
  from pool s
  order by
    (case when s.follows_me then 3 else 0 end)
    + (case when s.teammate then 2 else 0 end)
    + (case when s.last_trained_at > now() - interval '7 days' then 1 else 0 end)
    + (case when s.posted then 1 else 0 end)
    + least(s.streak, 30) / 30.0 desc,
    s.last_trained_at desc nulls last, s.user_id
  limit 20;
$$;
revoke all on function public.suggested_athletes() from anon, public;
grant execute on function public.suggested_athletes() to authenticated;

-- ─── Feed rows say whether the author can be followed ───────────────────────
-- The return type changes, so the two pages are dropped and made again. Bodies are the
-- run-10 versions plus `author_followable`.
drop function if exists public.feed_page(integer, integer);
create function public.feed_page(p_offset integer, p_limit integer)
returns table (
  id uuid, user_id uuid, display_name text, level integer, rank text, avatar_version integer,
  kind text, body text, audience text, workout_title text, workout_minutes integer, workout_sets integer,
  workout_records integer, photo_path text, created_at timestamptz,
  reactions jsonb, my_reaction text, comment_count integer, is_mine boolean, is_following boolean,
  author_followable boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (select (select auth.uid()) as uid),
  candidates as (
    select p.*
    from public.feed_posts p, me
    where me.uid is not null
      and p.created_at > now() - interval '21 days'
      and public.feed_can_view(me.uid, p.id)
    order by p.created_at desc
    limit 400
  ),
  scored as (
    select c.*,
      (select count(*) from public.feed_reactions r where r.post_id = c.id) as reaction_total,
      (select count(*) from public.feed_comments m where m.post_id = c.id
         and (c.user_id = (select uid from me) or not public.athletes_blocked((select uid from me), m.user_id))) as comment_total,
      exists (select 1 from public.athlete_follows f, me where f.follower_id = me.uid and f.followee_id = c.user_id) as following,
      exists (select 1 from public.team_members a join public.team_members b on b.team_id = a.team_id, me
              where a.user_id = me.uid and b.user_id = c.user_id and c.user_id <> me.uid) as teammate,
      exists (select 1 from public.feed_seen s, me where s.user_id = me.uid and s.post_id = c.id) as seen
    from candidates c
  ),
  ranked as (
    select s.*,
      power(2.0, -extract(epoch from (now() - s.created_at)) / 108000.0)
        + (case when s.following then 1.6 else 0 end)
        + (case when s.teammate then 1.2 else 0 end)
        + ln(1 + s.reaction_total + 2 * s.comment_total) * 0.55
        + (case s.kind when 'workout' then 0.5 when 'photo' then 0.2 else 0 end)
        - (case when s.seen and s.user_id <> (select uid from me) then 2.5 else 0 end) as base_score,
      row_number() over (partition by s.user_id order by s.created_at desc) as author_position
    from scored s
  )
  select r.id, r.user_id, a.display_name, a.level, a.rank, a.avatar_version,
    r.kind, r.body, r.audience, r.workout_title, r.workout_minutes, r.workout_sets, r.workout_records,
    case when r.photo_ready then r.photo_path end, r.created_at,
    public.feed_reaction_tally((select uid from me), r.id),
    (select x.emoji from public.feed_reactions x, me where x.post_id = r.id and x.user_id = me.uid),
    r.comment_total::integer,
    r.user_id = (select uid from me),
    r.following,
    a.discoverable and r.user_id <> (select uid from me)
  from ranked r
  join public.athlete_profiles a on a.user_id = r.user_id
  order by r.base_score - 0.6 * (r.author_position - 1) desc, r.created_at desc, r.id
  offset least(greatest(0, coalesce(p_offset, 0)), 380)
  limit least(greatest(1, coalesce(p_limit, 20)), 30);
$$;
revoke all on function public.feed_page(integer, integer) from anon, public;
grant execute on function public.feed_page(integer, integer) to authenticated;

-- One athlete's posts, newest first, a page at a time (`p_before` is the oldest
-- `created_at` already on screen; null for the first page).
drop function if exists public.feed_by_athlete(uuid);
create function public.feed_by_athlete(p_user_id uuid, p_before timestamptz default null)
returns table (
  id uuid, user_id uuid, display_name text, level integer, rank text, avatar_version integer,
  kind text, body text, audience text, workout_title text, workout_minutes integer, workout_sets integer,
  workout_records integer, photo_path text, created_at timestamptz,
  reactions jsonb, my_reaction text, comment_count integer, is_mine boolean, is_following boolean,
  author_followable boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.user_id, a.display_name, a.level, a.rank, a.avatar_version,
    p.kind, p.body, p.audience, p.workout_title, p.workout_minutes, p.workout_sets, p.workout_records,
    case when p.photo_ready then p.photo_path end, p.created_at,
    public.feed_reaction_tally((select auth.uid()), p.id),
    (select x.emoji from public.feed_reactions x where x.post_id = p.id and x.user_id = (select auth.uid())),
    (select count(*) from public.feed_comments m where m.post_id = p.id
       and (p.user_id = (select auth.uid()) or not public.athletes_blocked((select auth.uid()), m.user_id)))::integer,
    p.user_id = (select auth.uid()),
    exists (select 1 from public.athlete_follows f where f.follower_id = (select auth.uid()) and f.followee_id = p.user_id),
    a.discoverable and p.user_id <> (select auth.uid())
  from public.feed_posts p
  join public.athlete_profiles a on a.user_id = p.user_id
  where (select auth.uid()) is not null
    and p.user_id = p_user_id
    and (p_before is null or p.created_at < p_before)
    and public.feed_can_view((select auth.uid()), p.id)
  order by p.created_at desc
  limit 30;
$$;
revoke all on function public.feed_by_athlete(uuid, timestamptz) from anon, public;
grant execute on function public.feed_by_athlete(uuid, timestamptz) to authenticated;

-- ─── The Following feed ─────────────────────────────────────────────────────
-- Newest first, only athletes the caller follows plus the caller's own posts. No ranking:
-- this is the "just my people" view.
create or replace function public.feed_following_page(p_before timestamptz, p_limit integer)
returns table (
  id uuid, user_id uuid, display_name text, level integer, rank text, avatar_version integer,
  kind text, body text, audience text, workout_title text, workout_minutes integer, workout_sets integer,
  workout_records integer, photo_path text, created_at timestamptz,
  reactions jsonb, my_reaction text, comment_count integer, is_mine boolean, is_following boolean,
  author_followable boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (select (select auth.uid()) as uid)
  select p.id, p.user_id, a.display_name, a.level, a.rank, a.avatar_version,
    p.kind, p.body, p.audience, p.workout_title, p.workout_minutes, p.workout_sets, p.workout_records,
    case when p.photo_ready then p.photo_path end, p.created_at,
    public.feed_reaction_tally(me.uid, p.id),
    (select x.emoji from public.feed_reactions x where x.post_id = p.id and x.user_id = me.uid),
    (select count(*) from public.feed_comments m where m.post_id = p.id
       and (p.user_id = me.uid or not public.athletes_blocked(me.uid, m.user_id)))::integer,
    p.user_id = me.uid,
    p.user_id <> me.uid,
    false
  from public.feed_posts p
  join public.athlete_profiles a on a.user_id = p.user_id
  cross join me
  where me.uid is not null
    and p.created_at > now() - interval '60 days'
    and (p_before is null or p.created_at < p_before)
    and (p.user_id = me.uid or exists (select 1 from public.athlete_follows f where f.follower_id = me.uid and f.followee_id = p.user_id))
    and public.feed_can_view(me.uid, p.id)
  order by p.created_at desc, p.id
  limit least(greatest(1, coalesce(p_limit, 20)), 30);
$$;
revoke all on function public.feed_following_page(timestamptz, integer) from anon, public;
grant execute on function public.feed_following_page(timestamptz, integer) to authenticated;
