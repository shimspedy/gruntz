-- Activity: one list of what happened to you. New followers, reactions on your posts,
-- comments on your posts, and replies to your comments, newest first, with an unread
-- count for the badge.
--
-- Nothing here is new information: each item already reaches the athlete as a push
-- naming the other athlete. The list reads only rows aimed at the caller, skips anyone
-- either side has blocked, and skips posts the caller can no longer see.

create table if not exists public.athlete_activity_reads (
  user_id uuid primary key references auth.users(id) on delete cascade,
  seen_at timestamptz not null default now()
);
alter table public.athlete_activity_reads enable row level security;
revoke all on table public.athlete_activity_reads from anon, authenticated, public;

-- Indexes the list leans on: reactions and comments by post, follows by followee exist
-- already; replies are found by parent.
create index if not exists athlete_follows_followee_created_idx on public.athlete_follows (followee_id, created_at desc);
create index if not exists feed_reactions_post_created_idx on public.feed_reactions (post_id, created_at desc);

-- Internal: every activity item for one athlete since a moment, newest first.
create or replace function public.activity_items(p_user uuid, p_since timestamptz, p_before timestamptz, p_limit integer)
returns table (
  kind text, actor_id uuid, created_at timestamptz, post_id uuid, comment_id uuid, emoji text, body text)
language sql
stable
security definer
set search_path = ''
as $$
  select * from (
    select 'follow'::text, f.follower_id, f.created_at, null::uuid, null::uuid, null::text, null::text
    from public.athlete_follows f
    where f.followee_id = p_user
      and f.created_at > p_since and (p_before is null or f.created_at < p_before)
    union all
    select 'reaction', r.user_id, r.created_at, r.post_id, null, r.emoji, null
    from public.feed_reactions r
    join public.feed_posts p on p.id = r.post_id
    where p.user_id = p_user and r.user_id <> p_user
      and r.created_at > p_since and (p_before is null or r.created_at < p_before)
    union all
    select case when c.parent_id is null then 'comment' else 'reply' end, c.user_id, c.created_at, c.post_id, c.id, null, left(c.body, 140)
    from public.feed_comments c
    join public.feed_posts p on p.id = c.post_id
    left join public.feed_comments parent on parent.id = c.parent_id
    where c.user_id <> p_user
      and (
        (c.parent_id is null and p.user_id = p_user)
        -- A reply to your comment, or any reply in a thread under your own post.
        or (c.parent_id is not null and (parent.user_id = p_user or p.user_id = p_user)))
      and c.created_at > p_since and (p_before is null or c.created_at < p_before)
  ) items (kind, actor_id, created_at, post_id, comment_id, emoji, body)
  where not public.athletes_blocked(p_user, items.actor_id)
    and (items.post_id is null or public.feed_can_view(p_user, items.post_id))
  order by items.created_at desc
  limit least(greatest(1, coalesce(p_limit, 30)), 50);
$$;
revoke all on function public.activity_items(uuid, timestamptz, timestamptz, integer) from anon, authenticated, public;

-- The caller's activity from the last 60 days, a page at a time (`p_before` is the
-- oldest `created_at` already on screen).
create or replace function public.my_activity(p_before timestamptz)
returns table (
  kind text, actor_id uuid, display_name text, avatar_version integer, created_at timestamptz,
  post_id uuid, comment_id uuid, emoji text, body text, post_preview text, post_kind text,
  is_following boolean, actor_followable boolean, unread boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (select (select auth.uid()) as uid),
  seen as (select coalesce((select r.seen_at from public.athlete_activity_reads r, me where r.user_id = me.uid), '-infinity'::timestamptz) as at)
  select i.kind, i.actor_id, a.display_name,
    -- A photo is shown on the same terms as everywhere else: findable, or followed by you.
    case when a.discoverable or exists (select 1 from public.athlete_follows f, me where f.follower_id = me.uid and f.followee_id = i.actor_id)
      then a.avatar_version else 0 end,
    i.created_at, i.post_id, i.comment_id, i.emoji, i.body,
    case when p.kind = 'workout' then p.workout_title else nullif(left(p.body, 80), '') end,
    p.kind,
    exists (select 1 from public.athlete_follows f, me where f.follower_id = me.uid and f.followee_id = i.actor_id),
    a.discoverable,
    i.created_at > (select at from seen)
  from me
  cross join lateral public.activity_items(me.uid, now() - interval '60 days', p_before, 30) i
  join public.athlete_profiles a on a.user_id = i.actor_id
  left join public.feed_posts p on p.id = i.post_id
  where me.uid is not null
  order by i.created_at desc;
$$;
revoke all on function public.my_activity(timestamptz) from anon, public;
grant execute on function public.my_activity(timestamptz) to authenticated;

-- How many items arrived since the caller last opened Activity (capped at 99 for the badge).
create or replace function public.activity_unread_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from (
    select 1
    from public.activity_items(
      (select auth.uid()),
      greatest(now() - interval '60 days', coalesce((select r.seen_at from public.athlete_activity_reads r where r.user_id = (select auth.uid())), '-infinity'::timestamptz)),
      null, 50) i
    join public.athlete_profiles a on a.user_id = i.actor_id
    where (select auth.uid()) is not null
    limit 99
  ) unread;
$$;
revoke all on function public.activity_unread_count() from anon, public;
grant execute on function public.activity_unread_count() to authenticated;

create or replace function public.mark_activity_seen()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  insert into public.athlete_activity_reads (user_id, seen_at) values (caller, now())
  on conflict (user_id) do update set seen_at = now();
end;
$$;
revoke all on function public.mark_activity_seen() from anon, public;
grant execute on function public.mark_activity_seen() to authenticated;
