-- An athlete may belong to several teams and lead several: a platoon, a Saturday
-- crew and a prep group at once. The roster row becomes one per membership, every
-- function takes the team it applies to, and the "which team" lookup behind the
-- policies becomes "which teams".

alter table public.team_members drop constraint if exists team_members_pkey;
alter table public.team_members add primary key (user_id, team_id);
create index if not exists team_members_user_id_idx on public.team_members (user_id);

create or replace function public.current_team_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select team_id from public.team_members where user_id = (select auth.uid());
$$;

revoke all on function public.current_team_ids() from anon, public;
grant execute on function public.current_team_ids() to authenticated;

drop policy if exists "teams_select_own_team" on public.teams;
create policy "teams_select_own_team"
on public.teams for select
to authenticated
using (id in (select public.current_team_ids()));

drop policy if exists "team_members_select_own_team" on public.team_members;
create policy "team_members_select_own_team"
on public.team_members for select
to authenticated
using (team_id in (select public.current_team_ids()));

drop policy if exists "team_avatars_select_team" on storage.objects;
create policy "team_avatars_select_team"
on storage.objects for select
to authenticated
using (
  bucket_id = 'team-avatars'
  and exists (
    select 1 from public.team_members m
    where m.team_id in (select public.current_team_ids())
      and m.user_id::text || '.jpg' = storage.objects.name
  )
);

-- Kept for older app builds; the policies no longer depend on it.
create or replace function public.current_team_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select team_id from public.team_members where user_id = (select auth.uid()) order by joined_at asc limit 1;
$$;

-- Enough for anyone's real life, few enough that a roster screen stays readable.
create or replace function public.assert_team_room(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.team_members where user_id = p_user) >= 10 then raise exception 'TOO_MANY_TEAMS'; end if;
end;
$$;
revoke all on function public.assert_team_room(uuid) from anon, authenticated, public;

create or replace function public.create_team(p_name text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  new_team uuid;
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  perform public.assert_team_room(caller);

  insert into public.teams (name, invite_code, owner_id)
  values (btrim(p_name), public.new_team_invite_code(), caller)
  returning id into new_team;

  insert into public.team_members (user_id, team_id, display_name, role)
  values (caller, new_team, btrim(p_display_name), 'leader');

  return new_team;
end;
$$;

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
  select id into target from public.teams where invite_code = upper(btrim(p_code));
  if target is null then raise exception 'TEAM_NOT_FOUND'; end if;
  if exists (select 1 from public.team_members where user_id = caller and team_id = target) then raise exception 'ALREADY_IN_TEAM'; end if;
  perform public.assert_team_room(caller);
  if (select count(*) from public.team_members where team_id = target) >= 50 then raise exception 'TEAM_FULL'; end if;

  insert into public.team_members (user_id, team_id, display_name, role)
  values (caller, target, btrim(p_display_name), 'member');

  return target;
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

-- The no-argument form leaves the oldest membership, for app builds that predate several teams.
create or replace function public.leave_team()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.leave_team((select public.current_team_id()));
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
  if not exists (select 1 from public.team_members where user_id = caller and team_id = p_team_id and role = 'leader') then raise exception 'NOT_LEADER'; end if;
  if p_user_id = caller then raise exception 'USE_LEAVE_TEAM'; end if;
  delete from public.team_members where user_id = p_user_id and team_id = p_team_id;
end;
$$;

create or replace function public.remove_team_member(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.remove_team_member((select public.current_team_id()), p_user_id);
end;
$$;

-- Status and photo are the athlete's, so every team they are in sees the same ones.
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
  set sessions = greatest(0, p_sessions),
      streak = greatest(0, p_streak),
      status = case when p_status in ('green', 'amber', 'red') then p_status else 'unknown' end,
      display_name = coalesce(nullif(btrim(p_display_name), ''), display_name),
      updated_at = now()
  where user_id = caller;
end;
$$;

revoke all on function public.leave_team(uuid) from anon, public;
revoke all on function public.remove_team_member(uuid, uuid) from anon, public;
grant execute on function public.leave_team(uuid) to authenticated;
grant execute on function public.remove_team_member(uuid, uuid) to authenticated;
