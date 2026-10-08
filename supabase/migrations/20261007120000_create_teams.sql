-- Teams for Gruntz ("Leader tools").
--
-- A leader creates a team and hands out its invite code; athletes join with the
-- code. The roster shows three things per athlete and nothing else: how many
-- sessions they have completed, their streak, and a green / amber / red readiness
-- status. Weights, sleep, limitations and test scores never leave the phone, so
-- there are no columns for them here.
--
-- An athlete belongs to at most one team (the primary key on team_members is the
-- athlete). That keeps "which team am I sharing with" a question with one answer.

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint teams_name_length check (char_length(btrim(name)) between 1 and 40),
  constraint teams_invite_code_shape check (invite_code ~ '^[A-Z2-9]{6}$')
);

create table if not exists public.team_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  display_name text not null,
  role text not null default 'member',
  sessions integer not null default 0,
  streak integer not null default 0,
  status text not null default 'unknown',
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_members_name_length check (char_length(btrim(display_name)) between 1 and 40),
  constraint team_members_role check (role in ('leader', 'member')),
  constraint team_members_status check (status in ('green', 'amber', 'red', 'unknown')),
  constraint team_members_sessions_positive check (sessions >= 0),
  constraint team_members_streak_positive check (streak >= 0)
);

create index if not exists team_members_team_id_idx on public.team_members (team_id);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- Same reset as the backups table: "Automatically expose new tables" hands out
-- TRUNCATE, which row-level security does not cover.
revoke all on table public.teams from anon, authenticated, public;
revoke all on table public.team_members from anon, authenticated, public;

-- Read only. Every write goes through the functions below, so the rules about who
-- may create, join, leave and remove live in one place instead of in policies that
-- have to anticipate every combination of columns a client could send.
grant select on table public.teams to authenticated;
grant select on table public.team_members to authenticated;

-- Which team the caller is in. SECURITY DEFINER so the policies below can ask
-- without the lookup itself being subject to those same policies (a policy on
-- team_members that selects from team_members recurses).
create or replace function public.current_team_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select team_id from public.team_members where user_id = (select auth.uid());
$$;

revoke all on function public.current_team_id() from anon, public;
grant execute on function public.current_team_id() to authenticated;

-- You can see your own team and the people in it. Nothing else: there is no way to
-- list teams, and an invite code cannot be read without already being a member.
drop policy if exists "teams_select_own_team" on public.teams;
create policy "teams_select_own_team"
on public.teams for select
to authenticated
using (id = (select public.current_team_id()));

drop policy if exists "team_members_select_own_team" on public.team_members;
create policy "team_members_select_own_team"
on public.team_members for select
to authenticated
using (team_id = (select public.current_team_id()));

-- Six characters from an alphabet without 0/O and 1/I/L, so a code read out loud
-- or copied off a whiteboard cannot be mistyped into a different valid code.
create or replace function public.new_team_invite_code()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  candidate text;
begin
  loop
    candidate := '';
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.teams where invite_code = candidate);
  end loop;
  return candidate;
end;
$$;

revoke all on function public.new_team_invite_code() from anon, authenticated, public;

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
  if exists (select 1 from public.team_members where user_id = caller) then raise exception 'ALREADY_IN_TEAM'; end if;

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
  if exists (select 1 from public.team_members where user_id = caller) then raise exception 'ALREADY_IN_TEAM'; end if;

  select id into target from public.teams where invite_code = upper(btrim(p_code));
  if target is null then raise exception 'TEAM_NOT_FOUND'; end if;
  -- A section, not a battalion: the roster is one screen a leader reads at a glance.
  if (select count(*) from public.team_members where team_id = target) >= 50 then raise exception 'TEAM_FULL'; end if;

  insert into public.team_members (user_id, team_id, display_name, role)
  values (caller, target, btrim(p_display_name), 'member');

  return target;
end;
$$;

-- Leaving never strands a team without a leader: the longest-standing member takes
-- over, and a team with nobody left is removed.
create or replace function public.leave_team()
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
  select * into mine from public.team_members where user_id = caller;
  if not found then return; end if;

  delete from public.team_members where user_id = caller;

  if mine.role = 'leader' then
    select user_id into successor from public.team_members
    where team_id = mine.team_id order by joined_at asc limit 1;
    if successor is null then
      delete from public.teams where id = mine.team_id;
    else
      update public.team_members set role = 'leader' where user_id = successor;
      update public.teams set owner_id = successor where id = mine.team_id;
    end if;
  end if;
end;
$$;

create or replace function public.remove_team_member(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  my_team uuid;
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  select team_id into my_team from public.team_members where user_id = caller and role = 'leader';
  if my_team is null then raise exception 'NOT_LEADER'; end if;
  if p_user_id = caller then raise exception 'USE_LEAVE_TEAM'; end if;
  delete from public.team_members where user_id = p_user_id and team_id = my_team;
end;
$$;

-- The only thing an athlete publishes. `updated_at` is set here, server-side, so a
-- phone with a wrong clock cannot claim a status is fresher than it is.
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

revoke all on function public.create_team(text, text) from anon, public;
revoke all on function public.join_team(text, text) from anon, public;
revoke all on function public.leave_team() from anon, public;
revoke all on function public.remove_team_member(uuid) from anon, public;
revoke all on function public.update_team_status(integer, integer, text, text) from anon, public;

grant execute on function public.create_team(text, text) to authenticated;
grant execute on function public.join_team(text, text) to authenticated;
grant execute on function public.leave_team() to authenticated;
grant execute on function public.remove_team_member(uuid) to authenticated;
grant execute on function public.update_team_status(integer, integer, text, text) to authenticated;
