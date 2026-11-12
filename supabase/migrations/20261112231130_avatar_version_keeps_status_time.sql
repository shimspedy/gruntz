-- `team_members.updated_at` is what the roster shows as "status · 5m ago". The avatar
-- sync runs on every launch for a member with a photo, and it bumped that column, so a
-- three-day-old readiness status read as minutes old to the team leader.
--
-- The avatar version is now written without touching `updated_at`, and only when it
-- actually changes. Same signature, same grants, same pinned search_path.
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
  update public.team_members
  set avatar_version = v
  where user_id = caller
    and avatar_version is distinct from v;
end;
$$;

revoke all on function public.set_team_avatar_version(integer) from anon, public;
grant execute on function public.set_team_avatar_version(integer) to authenticated;
