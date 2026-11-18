-- Security audit run-11: blocking must not work as a lookup.
--
-- A profile's follower / following counts, and every post's reaction tally, used to skip
-- athletes the viewer had blocked. Blocking needs no relationship, so any signed-in
-- athlete could read a count, block someone, read it again, and learn from the drop
-- whether that someone follows (or is followed by) the athlete, or reacted to the post
-- and with which emoji. Follow lists and reactor identities are meant to stay private.
--
-- Counts are now the same for every viewer. Blocking still hides the blocked athlete's
-- profile, posts and comments; only the numbers stop changing with it.

create or replace function public.feed_reaction_tally(p_viewer uuid, p_post_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(t.emoji, t.n), '{}'::jsonb) from (
    select x.emoji, count(*) as n from public.feed_reactions x
    where x.post_id = p_post_id
    group by x.emoji) t;
$$;
revoke all on function public.feed_reaction_tally(uuid, uuid) from anon, authenticated, public;

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
      case when me or findable or i_follow then p.avatar_version else 0 end,
      case when open_stats then p.sessions end,
      case when open_stats then p.streak end,
      case when open_stats then (case when p.week_start = (date_trunc('week', now() at time zone 'utc'))::date then p.week_sessions else 0 end) end,
      case when open_stats then p.last_trained_at end,
      (select count(*) from public.feed_posts x where x.user_id = target and public.feed_can_view(caller, x.id))::integer,
      -- Every follow row counts, whoever is looking (see the header).
      case when open_stats then (select count(*) from public.athlete_follows f where f.followee_id = target)::integer end,
      case when open_stats then (select count(*) from public.athlete_follows f where f.follower_id = target)::integer end,
      me, i_follow, they_follow, (not me and findable), findable
    from public.athlete_profiles p
    where p.user_id = target;
end;
$$;
revoke all on function public.athlete_profile(uuid) from anon, public;
grant execute on function public.athlete_profile(uuid) to authenticated;
