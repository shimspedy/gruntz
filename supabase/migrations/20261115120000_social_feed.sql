-- The feed: posts (text, a finished workout, a photo), comments with one level of
-- replies, one emoji reaction per athlete per post, reports, and a ranked page.
--
-- Signed-in athletes only. No app role touches these tables: every read and write goes
-- through the definer functions below, which take identity from the caller's token and
-- apply audience and blocks on every path. Authors appear by their athlete card
-- (`athlete_profiles`), so posting needs a card.

-- ─── Tables ─────────────────────────────────────────────────────────────────
create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  body text not null default '',
  audience text not null default 'everyone',
  workout_title text,
  workout_minutes integer,
  workout_sets integer,
  workout_records integer,
  -- Set by the server for a photo post; the object must exist before the post is shown.
  photo_path text,
  photo_ready boolean not null default false,
  -- Hidden pending review once several athletes have reported it.
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  constraint feed_posts_kind check (kind in ('text', 'workout', 'photo')),
  constraint feed_posts_audience check (audience in ('everyone', 'followers')),
  constraint feed_posts_body_length check (char_length(body) <= 500),
  constraint feed_posts_text_has_body check (kind <> 'text' or char_length(btrim(body)) >= 1),
  constraint feed_posts_workout_shape check (
    kind <> 'workout' or (
      workout_title is not null and char_length(btrim(workout_title)) between 1 and 80
      and workout_minutes between 0 and 1440 and workout_sets between 0 and 1000 and workout_records between 0 and 100)),
  constraint feed_posts_photo_shape check ((kind = 'photo') = (photo_path is not null))
);
create index if not exists feed_posts_recent_idx on public.feed_posts (created_at desc);
create index if not exists feed_posts_user_idx on public.feed_posts (user_id, created_at desc);
alter table public.feed_posts enable row level security;
revoke all on table public.feed_posts from anon, authenticated, public;

create table if not exists public.feed_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- One level of replies: a reply points at a top-level comment on the same post.
  parent_id uuid references public.feed_comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint feed_comments_body_length check (char_length(btrim(body)) between 1 and 300)
);
create index if not exists feed_comments_post_idx on public.feed_comments (post_id, created_at);
create index if not exists feed_comments_user_idx on public.feed_comments (user_id);
create index if not exists feed_comments_parent_idx on public.feed_comments (parent_id);
alter table public.feed_comments enable row level security;
revoke all on table public.feed_comments from anon, authenticated, public;

create table if not exists public.feed_reactions (
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id),
  constraint feed_reactions_emoji check (emoji in ('strong', 'fire', 'clap', 'salute', 'heart', 'laugh'))
);
create index if not exists feed_reactions_user_idx on public.feed_reactions (user_id);
alter table public.feed_reactions enable row level security;
revoke all on table public.feed_reactions from anon, authenticated, public;

-- What the caller has already been shown, so the next page leads with something new.
create table if not exists public.feed_seen (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index if not exists feed_seen_post_idx on public.feed_seen (post_id);
alter table public.feed_seen enable row level security;
revoke all on table public.feed_seen from anon, authenticated, public;

-- Kept for review after the post, comment or either account is gone.
create table if not exists public.feed_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  post_id uuid references public.feed_posts(id) on delete set null,
  comment_id uuid references public.feed_comments(id) on delete set null,
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  snapshot text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint feed_reports_reason_length check (char_length(btrim(reason)) between 1 and 500)
);
create index if not exists feed_reports_reporter_idx on public.feed_reports (reporter_id, created_at desc);
create index if not exists feed_reports_post_idx on public.feed_reports (post_id);
create index if not exists feed_reports_comment_idx on public.feed_reports (comment_id);
create index if not exists feed_reports_author_idx on public.feed_reports (author_id);
alter table public.feed_reports enable row level security;
revoke all on table public.feed_reports from anon, authenticated, public;

-- Rate limits count this ledger, which the caller cannot delete from: removing a post or
-- a comment does not hand the allowance back.
create table if not exists public.feed_action_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now(),
  constraint feed_action_events_kind check (kind in ('post', 'comment', 'report'))
);
create index if not exists feed_action_events_user_idx on public.feed_action_events (user_id, kind, created_at desc);
alter table public.feed_action_events enable row level security;
revoke all on table public.feed_action_events from anon, authenticated, public;

-- ─── Internal helpers (not callable by app roles) ───────────────────────────
-- Counts the caller's recent actions of one kind, refuses past the limit, records this one.
create or replace function public.feed_take_allowance(p_user uuid, p_kind text, p_limit integer, p_window interval)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('feed_action:' || p_kind || ':' || p_user::text, 0));
  if (select count(*) from public.feed_action_events e
      where e.user_id = p_user and e.kind = p_kind and e.created_at > now() - p_window) >= p_limit then
    raise exception 'RATE_LIMITED';
  end if;
  insert into public.feed_action_events (user_id, kind) values (p_user, p_kind);
  delete from public.feed_action_events e where e.user_id = p_user and e.kind = p_kind and e.created_at < now() - interval '2 days';
end;
$$;
revoke all on function public.feed_take_allowance(uuid, text, integer, interval) from anon, authenticated, public;

-- Whether one athlete may see one post: not hidden, photo in place, not blocked either
-- way, and either it is their own, it is for everyone, or they follow the author.
create or replace function public.feed_can_view(p_viewer uuid, p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.feed_posts p
    where p.id = p_post_id
      and (p.user_id = p_viewer or (
        not p.hidden
        and (p.kind <> 'photo' or p.photo_ready)
        and not public.athletes_blocked(p_viewer, p.user_id)
        and (p.audience = 'everyone' or exists (
          select 1 from public.athlete_follows f where f.follower_id = p_viewer and f.followee_id = p.user_id))))
  );
$$;
revoke all on function public.feed_can_view(uuid, uuid) from anon, authenticated, public;

-- ─── Posting ────────────────────────────────────────────────────────────────
-- Returns the new post's id. For a photo post the id is also where the photo goes:
-- `<user id>/<post id>.jpg` in the `feed-photos` bucket, then `confirm_feed_photo`.
create or replace function public.create_feed_post(p_kind text, p_body text, p_audience text, p_workout_title text, p_workout_minutes integer, p_workout_sets integer, p_workout_records integer)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  new_id uuid := gen_random_uuid();
  text_body text := left(btrim(coalesce(p_body, '')), 500);
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  if p_kind is null or p_kind not in ('text', 'workout', 'photo') then raise exception 'INVALID_POST'; end if;
  if p_kind = 'text' and char_length(text_body) < 1 then raise exception 'INVALID_POST'; end if;
  -- Authors are shown by their athlete card; no card, no byline.
  if not exists (select 1 from public.athlete_profiles a where a.user_id = caller) then raise exception 'NO_PROFILE'; end if;
  perform public.feed_take_allowance(caller, 'post', 12, interval '1 day');
  insert into public.feed_posts (id, user_id, kind, body, audience, workout_title, workout_minutes, workout_sets, workout_records, photo_path)
  values (
    new_id, caller, p_kind, text_body,
    case when p_audience = 'followers' then 'followers' else 'everyone' end,
    case when p_kind = 'workout' then left(btrim(coalesce(p_workout_title, '')), 80) end,
    case when p_kind = 'workout' then least(greatest(0, coalesce(p_workout_minutes, 0)), 1440) end,
    case when p_kind = 'workout' then least(greatest(0, coalesce(p_workout_sets, 0)), 1000) end,
    case when p_kind = 'workout' then least(greatest(0, coalesce(p_workout_records, 0)), 100) end,
    case when p_kind = 'photo' then caller::text || '/' || new_id::text || '.jpg' end);
  return new_id;
end;
$$;
revoke all on function public.create_feed_post(text, text, text, text, integer, integer, integer) from anon, public;
grant execute on function public.create_feed_post(text, text, text, text, integer, integer, integer) to authenticated;

-- A photo post is shown only once its object is in the bucket.
create or replace function public.confirm_feed_photo(p_post_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  path text;
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  select p.photo_path into path from public.feed_posts p where p.id = p_post_id and p.user_id = caller and p.kind = 'photo';
  if path is null then raise exception 'NOT_FOUND'; end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'feed-photos' and o.name = path) then return false; end if;
  update public.feed_posts set photo_ready = true where id = p_post_id;
  return true;
end;
$$;
revoke all on function public.confirm_feed_photo(uuid) from anon, public;
grant execute on function public.confirm_feed_photo(uuid) to authenticated;

create or replace function public.delete_feed_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  delete from public.feed_posts where id = p_post_id and user_id = caller;
end;
$$;
revoke all on function public.delete_feed_post(uuid) from anon, public;
grant execute on function public.delete_feed_post(uuid) to authenticated;

-- ─── The ranked page ────────────────────────────────────────────────────────
-- Candidates: everything the caller may see from the last 21 days (at most 400 newest).
-- Score, highest first:
--   freshness   2 ^ (-age / 30 h), so a post loses half its pull every 30 hours
--   closeness   +1.6 following the author, +1.2 a teammate, +0.5 on the same plan
--   interest    ln(1 + reactions + 2 x comments) x 0.55: what other athletes responded to
--   gym first   +0.5 for a finished workout, +0.2 for a photo
--   new to you  -2.5 once it has been shown to the caller; own posts are never penalised
--   variety     -0.6 for each earlier post by the same author on this page
-- An athlete who follows nobody still gets a full page: freshness, interest, plan and
-- workout terms need no relationships.
create or replace function public.feed_page(p_offset integer, p_limit integer)
returns table (
  id uuid, user_id uuid, display_name text, level integer, rank text, avatar_version integer,
  kind text, body text, audience text, workout_title text, workout_minutes integer, workout_sets integer,
  workout_records integer, photo_path text, created_at timestamptz,
  reactions jsonb, my_reaction text, comment_count integer, is_mine boolean, is_following boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (select (select auth.uid()) as uid),
  my_plan as (select f.plan_id from public.plan_follows f, me where f.user_id = me.uid),
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
         and not public.athletes_blocked((select uid from me), m.user_id)) as comment_total,
      exists (select 1 from public.athlete_follows f, me where f.follower_id = me.uid and f.followee_id = c.user_id) as following,
      exists (select 1 from public.team_members a join public.team_members b on b.team_id = a.team_id, me
              where a.user_id = me.uid and b.user_id = c.user_id and c.user_id <> me.uid) as teammate,
      exists (select 1 from public.plan_follows f, my_plan where f.user_id = c.user_id and f.plan_id = my_plan.plan_id) as same_plan,
      exists (select 1 from public.feed_seen s, me where s.user_id = me.uid and s.post_id = c.id) as seen
    from candidates c
  ),
  ranked as (
    select s.*,
      power(2.0, -extract(epoch from (now() - s.created_at)) / 108000.0)
        + (case when s.following then 1.6 else 0 end)
        + (case when s.teammate then 1.2 else 0 end)
        + (case when s.same_plan then 0.5 else 0 end)
        + ln(1 + s.reaction_total + 2 * s.comment_total) * 0.55
        + (case s.kind when 'workout' then 0.5 when 'photo' then 0.2 else 0 end)
        - (case when s.seen and s.user_id <> (select uid from me) then 2.5 else 0 end) as base_score,
      row_number() over (partition by s.user_id order by s.created_at desc) as author_position
    from scored s
  )
  select r.id, r.user_id, a.display_name, a.level, a.rank, a.avatar_version,
    r.kind, r.body, r.audience, r.workout_title, r.workout_minutes, r.workout_sets, r.workout_records,
    case when r.photo_ready then r.photo_path end, r.created_at,
    coalesce((select jsonb_object_agg(t.emoji, t.n) from (
      select x.emoji, count(*) as n from public.feed_reactions x where x.post_id = r.id group by x.emoji) t), '{}'::jsonb),
    (select x.emoji from public.feed_reactions x, me where x.post_id = r.id and x.user_id = me.uid),
    r.comment_total::integer,
    r.user_id = (select uid from me),
    r.following
  from ranked r
  join public.athlete_profiles a on a.user_id = r.user_id
  order by r.base_score - 0.6 * (r.author_position - 1) desc, r.created_at desc, r.id
  offset least(greatest(0, coalesce(p_offset, 0)), 380)
  limit least(greatest(1, coalesce(p_limit, 20)), 30);
$$;
revoke all on function public.feed_page(integer, integer) from anon, public;
grant execute on function public.feed_page(integer, integer) to authenticated;

-- One athlete's posts, newest first, for their page. Same visibility rules.
create or replace function public.feed_by_athlete(p_user_id uuid)
returns table (
  id uuid, user_id uuid, display_name text, level integer, rank text, avatar_version integer,
  kind text, body text, audience text, workout_title text, workout_minutes integer, workout_sets integer,
  workout_records integer, photo_path text, created_at timestamptz,
  reactions jsonb, my_reaction text, comment_count integer, is_mine boolean, is_following boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.user_id, a.display_name, a.level, a.rank, a.avatar_version,
    p.kind, p.body, p.audience, p.workout_title, p.workout_minutes, p.workout_sets, p.workout_records,
    case when p.photo_ready then p.photo_path end, p.created_at,
    coalesce((select jsonb_object_agg(t.emoji, t.n) from (
      select x.emoji, count(*) as n from public.feed_reactions x where x.post_id = p.id group by x.emoji) t), '{}'::jsonb),
    (select x.emoji from public.feed_reactions x where x.post_id = p.id and x.user_id = (select auth.uid())),
    (select count(*) from public.feed_comments m where m.post_id = p.id
       and not public.athletes_blocked((select auth.uid()), m.user_id))::integer,
    p.user_id = (select auth.uid()),
    exists (select 1 from public.athlete_follows f where f.follower_id = (select auth.uid()) and f.followee_id = p.user_id)
  from public.feed_posts p
  join public.athlete_profiles a on a.user_id = p.user_id
  where (select auth.uid()) is not null
    and p.user_id = p_user_id
    and public.feed_can_view((select auth.uid()), p.id)
  order by p.created_at desc
  limit 50;
$$;
revoke all on function public.feed_by_athlete(uuid) from anon, public;
grant execute on function public.feed_by_athlete(uuid) to authenticated;

-- Records what the caller was shown. At most 40 ids a call; unseeable ids are ignored.
create or replace function public.mark_feed_seen(p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  if p_ids is null or cardinality(p_ids) = 0 then return; end if;
  insert into public.feed_seen (user_id, post_id)
  select caller, p.id from public.feed_posts p
  where p.id = any(p_ids[1:40]) and public.feed_can_view(caller, p.id)
  on conflict (user_id, post_id) do update set seen_at = now();
  delete from public.feed_seen s where s.user_id = caller and s.seen_at < now() - interval '30 days';
end;
$$;
revoke all on function public.mark_feed_seen(uuid[]) from anon, public;
grant execute on function public.mark_feed_seen(uuid[]) to authenticated;

-- ─── Reactions ──────────────────────────────────────────────────────────────
-- One reaction per athlete per post; null takes it back.
create or replace function public.set_feed_reaction(p_post_id uuid, p_emoji text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  if p_emoji is null then
    delete from public.feed_reactions where post_id = p_post_id and user_id = caller;
    return;
  end if;
  if p_emoji not in ('strong', 'fire', 'clap', 'salute', 'heart', 'laugh') then raise exception 'INVALID_REACTION'; end if;
  if not public.feed_can_view(caller, p_post_id) then raise exception 'NOT_FOUND'; end if;
  insert into public.feed_reactions (post_id, user_id, emoji) values (p_post_id, caller, p_emoji)
  on conflict (post_id, user_id) do update set emoji = excluded.emoji, created_at = now();
end;
$$;
revoke all on function public.set_feed_reaction(uuid, text) from anon, public;
grant execute on function public.set_feed_reaction(uuid, text) to authenticated;

-- ─── Comments ───────────────────────────────────────────────────────────────
create or replace function public.feed_post_comments(p_post_id uuid)
returns table (id uuid, parent_id uuid, user_id uuid, display_name text, avatar_version integer, body text, created_at timestamptz, is_mine boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.parent_id, c.user_id, coalesce(a.display_name, 'Athlete'), coalesce(a.avatar_version, 0), c.body, c.created_at,
    c.user_id = (select auth.uid())
  from public.feed_comments c
  left join public.athlete_profiles a on a.user_id = c.user_id
  where (select auth.uid()) is not null
    and c.post_id = p_post_id
    and public.feed_can_view((select auth.uid()), p_post_id)
    and not public.athletes_blocked((select auth.uid()), c.user_id)
  order by c.created_at
  limit 300;
$$;
revoke all on function public.feed_post_comments(uuid) from anon, public;
grant execute on function public.feed_post_comments(uuid) to authenticated;

create or replace function public.add_feed_comment(p_post_id uuid, p_parent_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  text_body text := left(btrim(coalesce(p_body, '')), 300);
  new_id uuid;
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  if char_length(text_body) < 1 then raise exception 'INVALID_COMMENT'; end if;
  if not public.feed_can_view(caller, p_post_id) then raise exception 'NOT_FOUND'; end if;
  if not exists (select 1 from public.athlete_profiles a where a.user_id = caller) then raise exception 'NO_PROFILE'; end if;
  -- A reply hangs off a top-level comment on this post, never off another reply.
  if p_parent_id is not null and not exists (
    select 1 from public.feed_comments c where c.id = p_parent_id and c.post_id = p_post_id and c.parent_id is null
  ) then raise exception 'NOT_FOUND'; end if;
  perform public.feed_take_allowance(caller, 'comment', 60, interval '1 hour');
  if (select count(*) from public.feed_comments c where c.post_id = p_post_id) >= 500 then raise exception 'TOO_MANY'; end if;
  insert into public.feed_comments (post_id, user_id, parent_id, body) values (p_post_id, caller, p_parent_id, text_body)
  returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.add_feed_comment(uuid, uuid, text) from anon, public;
grant execute on function public.add_feed_comment(uuid, uuid, text) to authenticated;

-- The comment's author, or the author of the post it sits under, may remove it.
create or replace function public.delete_feed_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  delete from public.feed_comments c
  where c.id = p_comment_id
    and (c.user_id = caller or exists (select 1 from public.feed_posts p where p.id = c.post_id and p.user_id = caller));
end;
$$;
revoke all on function public.delete_feed_comment(uuid) from anon, public;
grant execute on function public.delete_feed_comment(uuid) to authenticated;

-- ─── Reports ────────────────────────────────────────────────────────────────
-- Exactly one of post or comment. The text and name are copied from the database, never
-- taken from the caller. A post reported by three different athletes is hidden until
-- reviewed.
create or replace function public.report_feed_item(p_post_id uuid, p_comment_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  why text := left(btrim(coalesce(p_reason, '')), 500);
  target_post uuid;
  author uuid;
  shown text;
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  if char_length(why) < 1 then raise exception 'INVALID_REASON'; end if;
  if (p_post_id is null) = (p_comment_id is null) then raise exception 'INVALID_TARGET'; end if;
  if p_comment_id is not null then
    select c.post_id, c.user_id, c.body into target_post, author, shown from public.feed_comments c where c.id = p_comment_id;
  else
    select p.id, p.user_id,
      case p.kind when 'workout' then '[workout] ' || coalesce(p.workout_title, '') || ' ' when 'photo' then '[photo] ' || coalesce(p.photo_path, '') || ' ' else '' end || p.body
    into target_post, author, shown from public.feed_posts p where p.id = p_post_id;
  end if;
  if target_post is null or author = caller or not public.feed_can_view(caller, target_post) then raise exception 'NOT_FOUND'; end if;
  perform public.feed_take_allowance(caller, 'report', 30, interval '1 day');
  insert into public.feed_reports (reporter_id, post_id, comment_id, author_id, author_name, snapshot, reason)
  values (caller, case when p_comment_id is null then target_post end, p_comment_id, author,
    coalesce((select a.display_name from public.athlete_profiles a where a.user_id = author), 'Athlete'), left(shown, 1000), why);
  if p_comment_id is null and (
    select count(distinct r.reporter_id) from public.feed_reports r where r.post_id = target_post and r.comment_id is null
  ) >= 3 then
    update public.feed_posts set hidden = true where id = target_post;
  end if;
end;
$$;
revoke all on function public.report_feed_item(uuid, uuid, text) from anon, public;
grant execute on function public.report_feed_item(uuid, uuid, text) to authenticated;

-- What the owner reads when something is reported. Service role only.
create or replace view public.feed_reports_review
with (security_invoker = true) as
  select r.created_at as reported_at, r.reason, r.author_name, r.author_id, r.snapshot,
    r.post_id, r.comment_id, r.reporter_id,
    (select p.hidden from public.feed_posts p where p.id = r.post_id) as post_hidden
  from public.feed_reports r
  order by r.created_at desc;
revoke all on public.feed_reports_review from anon, authenticated, public;

-- ─── Photos ─────────────────────────────────────────────────────────────────
-- Private bucket. An author may put one JPEG at the path the server chose for a post of
-- theirs that is still waiting for it; anyone who may see the post may read its photo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('feed-photos', 'feed-photos', false, 1572864, array['image/jpeg'])
on conflict (id) do nothing;

create or replace function public.feed_photo_owner(p_name text, p_waiting boolean)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.feed_posts p
    where p.photo_path = p_name and p.user_id = (select auth.uid()) and (not p_waiting or not p.photo_ready)
  );
$$;
revoke all on function public.feed_photo_owner(text, boolean) from anon, public;
grant execute on function public.feed_photo_owner(text, boolean) to authenticated;

create or replace function public.can_view_feed_photo(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.feed_posts p
    where p.photo_path = p_name and public.feed_can_view((select auth.uid()), p.id)
  );
$$;
revoke all on function public.can_view_feed_photo(text) from anon, public;
grant execute on function public.can_view_feed_photo(text) to authenticated;

drop policy if exists "feed_photos_insert_own_waiting" on storage.objects;
create policy "feed_photos_insert_own_waiting"
on storage.objects for insert
to authenticated
with check (bucket_id = 'feed-photos' and public.feed_photo_owner(name, true));

drop policy if exists "feed_photos_select_visible" on storage.objects;
create policy "feed_photos_select_visible"
on storage.objects for select
to authenticated
using (bucket_id = 'feed-photos' and public.can_view_feed_photo(name));

drop policy if exists "feed_photos_delete_own" on storage.objects;
create policy "feed_photos_delete_own"
on storage.objects for delete
to authenticated
using (bucket_id = 'feed-photos' and name like (select auth.uid())::text || '/%');

-- ─── Push notices for comments and reactions ────────────────────────────────
-- The push function claims these with the service role so each event notifies once.
-- A reaction is announced once per athlete per post, however often it is changed.
alter table public.feed_comments add column if not exists notified_at timestamptz;

create table if not exists public.feed_reaction_notices (
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists feed_reaction_notices_user_idx on public.feed_reaction_notices (user_id);
alter table public.feed_reaction_notices enable row level security;
revoke all on table public.feed_reaction_notices from anon, authenticated, public;

-- ─── Administration ─────────────────────────────────────────────────────────
-- Who may moderate. Rows are added by the owner in the SQL editor, never by the app.
create table if not exists public.app_admins (
  email text primary key,
  created_at timestamptz not null default now(),
  constraint app_admins_email_lower check (email = lower(email))
);
alter table public.app_admins enable row level security;
revoke all on table public.app_admins from anon, authenticated, public;

-- An admin is a listed email whose CURRENT session was started with Google sign-in.
-- The same address signed in by an emailed code is not an admin session: a code sent
-- to a mailbox must never be enough to moderate.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (select 1 from public.app_admins a where a.email = lower(coalesce((select auth.jwt()) ->> 'email', '')))
    and coalesce((select auth.jwt()) -> 'app_metadata' -> 'providers', '[]'::jsonb) ? 'google'
    and exists (
      select 1 from jsonb_array_elements(coalesce((select auth.jwt()) -> 'amr', '[]'::jsonb)) m
      where m ->> 'method' = 'oauth' and coalesce(m ->> 'provider', 'google') = 'google');
$$;
revoke all on function public.is_admin() from anon, public;
grant execute on function public.is_admin() to authenticated;

-- Reports, newest first, with what the report is about as it stands now.
create or replace function public.admin_feed_reports()
returns table (
  report_id uuid, reported_at timestamptz, reason text, author_id uuid, author_name text, snapshot text,
  post_id uuid, comment_id uuid, post_exists boolean, post_hidden boolean, comment_exists boolean,
  photo_path text, reports_on_post bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  return query
    select r.id, r.created_at, r.reason, r.author_id, r.author_name, r.snapshot, r.post_id, r.comment_id,
      p.id is not null, coalesce(p.hidden, false), c.id is not null,
      case when p.photo_ready then p.photo_path end,
      (select count(distinct x.reporter_id) from public.feed_reports x where x.post_id = r.post_id and r.post_id is not null)
    from public.feed_reports r
    left join public.feed_comments c on c.id = r.comment_id
    left join public.feed_posts p on p.id = coalesce(r.post_id, c.post_id)
    order by r.created_at desc
    limit 300;
end;
$$;
revoke all on function public.admin_feed_reports() from anon, public;
grant execute on function public.admin_feed_reports() to authenticated;

-- Every recent post, reported or not, so the owner can look before anyone complains.
create or replace function public.admin_recent_posts()
returns table (
  id uuid, user_id uuid, display_name text, kind text, body text, audience text, workout_title text,
  photo_path text, hidden boolean, created_at timestamptz, comments bigint, reactions bigint, reports bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  return query
    select p.id, p.user_id, coalesce(a.display_name, 'Athlete'), p.kind, p.body, p.audience, p.workout_title,
      case when p.photo_ready then p.photo_path end, p.hidden, p.created_at,
      (select count(*) from public.feed_comments c where c.post_id = p.id),
      (select count(*) from public.feed_reactions x where x.post_id = p.id),
      (select count(*) from public.feed_reports r where r.post_id = p.id)
    from public.feed_posts p
    left join public.athlete_profiles a on a.user_id = p.user_id
    order by p.created_at desc
    limit 200;
end;
$$;
revoke all on function public.admin_recent_posts() from anon, public;
grant execute on function public.admin_recent_posts() to authenticated;

create or replace function public.admin_post_comments(p_post_id uuid)
returns table (id uuid, parent_id uuid, user_id uuid, display_name text, body text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  return query
    select c.id, c.parent_id, c.user_id, coalesce(a.display_name, 'Athlete'), c.body, c.created_at
    from public.feed_comments c
    left join public.athlete_profiles a on a.user_id = c.user_id
    where c.post_id = p_post_id
    order by c.created_at
    limit 500;
end;
$$;
revoke all on function public.admin_post_comments(uuid) from anon, public;
grant execute on function public.admin_post_comments(uuid) to authenticated;

-- Hide keeps the post for review; unhide puts it back.
create or replace function public.admin_set_post_hidden(p_post_id uuid, p_hidden boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  update public.feed_posts set hidden = coalesce(p_hidden, true) where id = p_post_id;
end;
$$;
revoke all on function public.admin_set_post_hidden(uuid, boolean) from anon, public;
grant execute on function public.admin_set_post_hidden(uuid, boolean) to authenticated;

-- Removes the post with its comments and reactions. Returns the photo path, if any, so
-- the admin page can remove the object as well. Reports about it are kept.
create or replace function public.admin_delete_post(p_post_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  path text;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  delete from public.feed_posts where id = p_post_id returning photo_path into path;
  return path;
end;
$$;
revoke all on function public.admin_delete_post(uuid) from anon, public;
grant execute on function public.admin_delete_post(uuid) to authenticated;

create or replace function public.admin_delete_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  delete from public.feed_comments where id = p_comment_id;
end;
$$;
revoke all on function public.admin_delete_comment(uuid) from anon, public;
grant execute on function public.admin_delete_comment(uuid) to authenticated;

-- A report that needed no action.
create or replace function public.admin_dismiss_report(p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  delete from public.feed_reports where id = p_report_id;
end;
$$;
revoke all on function public.admin_dismiss_report(uuid) from anon, public;
grant execute on function public.admin_dismiss_report(uuid) to authenticated;

-- An admin can look at and remove any post photo.
drop policy if exists "feed_photos_select_admin" on storage.objects;
create policy "feed_photos_select_admin"
on storage.objects for select
to authenticated
using (bucket_id = 'feed-photos' and public.is_admin());

drop policy if exists "feed_photos_delete_admin" on storage.objects;
create policy "feed_photos_delete_admin"
on storage.objects for delete
to authenticated
using (bucket_id = 'feed-photos' and public.is_admin());
