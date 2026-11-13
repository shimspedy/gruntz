-- Security audit run-9: fixes for the feed and the admin check added in 20261115120000.
--
-- 1. Admin is bound to one account and its Google identity, not to an email address that
--    the account holder could change, and never to an account that has another outside
--    sign-in linked.
-- 2. The author of a post always sees every comment under it, so a block cannot leave
--    comments there that the author can neither see nor remove.
-- 3. Auto-hide needs three different established reporters, one report each, and never
--    overrides an admin's decision to show a post again. Reports no longer keep a path
--    that contains the author's id.
-- 4. The push function asks the database who may be told about a comment or reaction.

-- ─── 1. Admin ───────────────────────────────────────────────────────────────
alter table public.app_admins add column if not exists user_id uuid references auth.users(id) on delete cascade;
create unique index if not exists app_admins_user_idx on public.app_admins (user_id) where user_id is not null;

-- Bind each listed address to the account whose GOOGLE identity carries that address.
-- An address with no such account stays unbound and grants nothing.
update public.app_admins a
set user_id = (
  select i.user_id from auth.identities i
  where i.provider = 'google' and lower(i.identity_data ->> 'email') = a.email
  order by i.created_at
  limit 1)
where a.user_id is null;

-- An admin session is: this exact account is listed; the account has a Google identity
-- and no other outside identity (so nobody can reach it through a different provider);
-- and the current session was started by an identity-provider sign-in, not an emailed
-- code. When the session names its provider, it must be Google.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (select 1 from public.app_admins a where a.user_id = (select auth.uid()))
    and exists (select 1 from auth.identities i where i.user_id = (select auth.uid()) and i.provider = 'google')
    and not exists (select 1 from auth.identities i where i.user_id = (select auth.uid()) and i.provider not in ('google', 'email'))
    and exists (
      select 1 from jsonb_array_elements(coalesce((select auth.jwt()) -> 'amr', '[]'::jsonb)) m
      where m ->> 'method' = 'oauth' and coalesce(m ->> 'provider', 'google') = 'google');
$$;
revoke all on function public.is_admin() from anon, public;
grant execute on function public.is_admin() to authenticated;

-- Showing a post again is a decision: reports can no longer hide it afterwards.
alter table public.feed_posts add column if not exists cleared_at timestamptz;

create or replace function public.admin_set_post_hidden(p_post_id uuid, p_hidden boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  update public.feed_posts
  set hidden = coalesce(p_hidden, true),
      cleared_at = case when coalesce(p_hidden, true) then null else now() end
  where id = p_post_id;
end;
$$;
revoke all on function public.admin_set_post_hidden(uuid, boolean) from anon, public;
grant execute on function public.admin_set_post_hidden(uuid, boolean) to authenticated;

-- ─── 2. Comments across a block ─────────────────────────────────────────────
-- The post's author sees every comment under their own post, blocked or not: it is
-- their post, and they are the one who can remove what is written there.
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
  join public.feed_posts p on p.id = c.post_id
  left join public.athlete_profiles a on a.user_id = c.user_id
  where (select auth.uid()) is not null
    and c.post_id = p_post_id
    and public.feed_can_view((select auth.uid()), p_post_id)
    and (p.user_id = (select auth.uid()) or not public.athletes_blocked((select auth.uid()), c.user_id))
  order by c.created_at
  limit 500;
$$;
revoke all on function public.feed_post_comments(uuid) from anon, public;
grant execute on function public.feed_post_comments(uuid) to authenticated;

-- A reply to someone who has blocked you, or whom you blocked, is refused.
create or replace function public.add_feed_comment(p_post_id uuid, p_parent_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  text_body text := left(btrim(coalesce(p_body, '')), 300);
  parent_author uuid;
  new_id uuid;
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  if char_length(text_body) < 1 then raise exception 'INVALID_COMMENT'; end if;
  if not public.feed_can_view(caller, p_post_id) then raise exception 'NOT_FOUND'; end if;
  if not exists (select 1 from public.athlete_profiles a where a.user_id = caller) then raise exception 'NO_PROFILE'; end if;
  -- A reply hangs off a top-level comment on this post, never off another reply.
  if p_parent_id is not null then
    select c.user_id into parent_author from public.feed_comments c
    where c.id = p_parent_id and c.post_id = p_post_id and c.parent_id is null;
    if parent_author is null or public.athletes_blocked(caller, parent_author) then raise exception 'NOT_FOUND'; end if;
  end if;
  perform public.feed_take_allowance(caller, 'comment', 60, interval '1 hour');
  -- One writer at a time per post, so the ceiling cannot be raced past.
  perform pg_advisory_xact_lock(hashtextextended('feed_post_comments:' || p_post_id::text, 0));
  if (select count(*) from public.feed_comments c where c.post_id = p_post_id) >= 500 then raise exception 'TOO_MANY'; end if;
  insert into public.feed_comments (post_id, user_id, parent_id, body) values (p_post_id, caller, p_parent_id, text_body)
  returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.add_feed_comment(uuid, uuid, text) from anon, public;
grant execute on function public.add_feed_comment(uuid, uuid, text) to authenticated;

-- ─── 3. Reports ─────────────────────────────────────────────────────────────
-- One open report per reporter per target. Older duplicates go first so the indexes can be built.
delete from public.feed_reports r using public.feed_reports k
where r.reporter_id is not null and r.reporter_id = k.reporter_id and r.created_at > k.created_at
  and ((r.comment_id is not null and r.comment_id = k.comment_id)
    or (r.comment_id is null and k.comment_id is null and r.post_id is not null and r.post_id = k.post_id));
create unique index if not exists feed_reports_one_per_post_idx on public.feed_reports (reporter_id, post_id) where reporter_id is not null and post_id is not null and comment_id is null;
create unique index if not exists feed_reports_one_per_comment_idx on public.feed_reports (reporter_id, comment_id) where reporter_id is not null and comment_id is not null;

-- Existing snapshots of photo posts held the storage path, which contains the author's id.
update public.feed_reports set snapshot = regexp_replace(snapshot, '^\[photo\] \S+ ', '[photo] ') where snapshot like '[photo] %';

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
      case p.kind when 'workout' then '[workout] ' || coalesce(p.workout_title, '') || ' ' when 'photo' then '[photo] ' else '' end || p.body
    into target_post, author, shown from public.feed_posts p where p.id = p_post_id;
  end if;
  if target_post is null or author = caller or not public.feed_can_view(caller, target_post) then raise exception 'NOT_FOUND'; end if;
  -- Reporting the same thing twice changes nothing and costs nothing.
  if exists (
    select 1 from public.feed_reports r
    where r.reporter_id = caller
      and ((p_comment_id is not null and r.comment_id = p_comment_id) or (p_comment_id is null and r.post_id = target_post and r.comment_id is null))
  ) then return; end if;
  perform public.feed_take_allowance(caller, 'report', 30, interval '1 day');
  insert into public.feed_reports (reporter_id, post_id, comment_id, author_id, author_name, snapshot, reason)
  values (caller, case when p_comment_id is null then target_post end, p_comment_id, author,
    coalesce((select a.display_name from public.athlete_profiles a where a.user_id = author), 'Athlete'), left(shown, 1000), why);
  -- Hidden pending review once three different established athletes have reported it:
  -- each has an athlete card and an account at least a day old. A post an admin has
  -- already looked at and shown again is not hidden by reports a second time.
  if p_comment_id is null and (
    select count(distinct r.reporter_id) from public.feed_reports r
    join auth.users u on u.id = r.reporter_id
    where r.post_id = target_post and r.comment_id is null
      and u.created_at < now() - interval '1 day'
      and exists (select 1 from public.athlete_profiles a where a.user_id = r.reporter_id)
  ) >= 3 then
    update public.feed_posts set hidden = true where id = target_post and cleared_at is null;
  end if;
end;
$$;
revoke all on function public.report_feed_item(uuid, uuid, text) from anon, public;
grant execute on function public.report_feed_item(uuid, uuid, text) to authenticated;

-- Blocked athletes' reactions are not counted for the caller, like their comments.
-- (The ranked page and the athlete page both read through this.)
create or replace function public.feed_reaction_tally(p_viewer uuid, p_post_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(t.emoji, t.n), '{}'::jsonb) from (
    select x.emoji, count(*) as n from public.feed_reactions x
    where x.post_id = p_post_id and not public.athletes_blocked(p_viewer, x.user_id)
    group by x.emoji) t;
$$;
revoke all on function public.feed_reaction_tally(uuid, uuid) from anon, authenticated, public;

-- The two pages, unchanged except that reaction tallies skip blocked athletes and an
-- author's own post counts every comment under it.
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
         and (c.user_id = (select uid from me) or not public.athletes_blocked((select uid from me), m.user_id))) as comment_total,
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
    public.feed_reaction_tally((select uid from me), r.id),
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
    public.feed_reaction_tally((select auth.uid()), p.id),
    (select x.emoji from public.feed_reactions x where x.post_id = p.id and x.user_id = (select auth.uid())),
    (select count(*) from public.feed_comments m where m.post_id = p.id
       and (p.user_id = (select auth.uid()) or not public.athletes_blocked((select auth.uid()), m.user_id)))::integer,
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

-- ─── 4. Who may be told ─────────────────────────────────────────────────────
-- For the push function only (service role). Of the athletes it proposes to notify about
-- a comment or reaction by `p_sender` on `p_post_id`, returns those who may still see
-- the post and have no block with the sender, and nobody at all if the sender cannot see
-- the post any more or the post is hidden.
create or replace function public.feed_push_recipients(p_post_id uuid, p_sender uuid, p_ids uuid[])
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(distinct who), '{}'::uuid[])
  from unnest((coalesce(p_ids, '{}'::uuid[]))[1:10]) who
  where who is not null and who <> p_sender
    and exists (select 1 from public.feed_posts p where p.id = p_post_id and not p.hidden)
    and public.feed_can_view(p_sender, p_post_id)
    and public.feed_can_view(who, p_post_id)
    and not public.athletes_blocked(p_sender, who);
$$;
revoke all on function public.feed_push_recipients(uuid, uuid, uuid[]) from anon, authenticated, public;
grant execute on function public.feed_push_recipients(uuid, uuid, uuid[]) to service_role;
