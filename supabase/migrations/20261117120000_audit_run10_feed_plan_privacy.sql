-- Audit run-10: feed ranking no longer uses which plan an author follows.
-- Ranking gave posts from athletes on the viewer's own plan a +0.5 boost. A viewer
-- could switch plans back and forth and watch the feed order change to learn which
-- plan another athlete follows, which is meant to stay private. Same function,
-- minus the my_plan CTE and the same_plan term.

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
    r.following
  from ranked r
  join public.athlete_profiles a on a.user_id = r.user_id
  order by r.base_score - 0.6 * (r.author_position - 1) desc, r.created_at desc, r.id
  offset least(greatest(0, coalesce(p_offset, 0)), 380)
  limit least(greatest(1, coalesce(p_limit, 20)), 30);
$$;

revoke all on function public.feed_page(integer, integer) from anon, public;
grant execute on function public.feed_page(integer, integer) to authenticated;
