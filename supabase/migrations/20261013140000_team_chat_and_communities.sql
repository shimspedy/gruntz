-- Team chat, and teams that anyone can find and join.
--
-- Chat is a plain message log per team, readable by its members, written by its
-- members, deletable by the author or the team's leader. Reports go to a table the
-- app owner reads. Realtime delivers new rows to open chats; row-level security
-- applies there too.
--
-- A public team ("community") is listed by name, description and size to every
-- signed-in athlete, who may join it without a code. Its invite code and roster
-- stay member-only: the listing goes through a function that returns only what
-- a stranger should see.

alter table public.teams
  add column if not exists is_public boolean not null default false,
  add column if not exists description text not null default '';
alter table public.teams drop constraint if exists teams_description_length;
alter table public.teams add constraint teams_description_length check (char_length(description) <= 200);

create or replace function public.set_team_visibility(p_team_id uuid, p_public boolean, p_description text)
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
  update public.teams set is_public = p_public, description = left(btrim(coalesce(p_description, '')), 200) where id = p_team_id;
end;
$$;

create or replace function public.list_public_teams(p_query text)
returns table (id uuid, name text, description text, member_count bigint, is_member boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id, t.name, t.description,
         (select count(*) from public.team_members m where m.team_id = t.id) as member_count,
         exists (select 1 from public.team_members m where m.team_id = t.id and m.user_id = (select auth.uid())) as is_member
  from public.teams t
  where t.is_public
    and (select auth.uid()) is not null
    and (coalesce(btrim(p_query), '') = '' or t.name ilike '%' || btrim(p_query) || '%' or t.description ilike '%' || btrim(p_query) || '%')
  order by member_count desc, t.name asc
  limit 50;
$$;

create or replace function public.join_public_team(p_team_id uuid, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then raise exception 'NOT_SIGNED_IN'; end if;
  if not exists (select 1 from public.teams where id = p_team_id and is_public) then raise exception 'TEAM_NOT_FOUND'; end if;
  if exists (select 1 from public.team_members where user_id = caller and team_id = p_team_id) then raise exception 'ALREADY_IN_TEAM'; end if;
  perform public.assert_team_room(caller);
  if (select count(*) from public.team_members where team_id = p_team_id) >= 50 then raise exception 'TEAM_FULL'; end if;
  insert into public.team_members (user_id, team_id, display_name, role)
  values (caller, p_team_id, btrim(p_display_name), 'member');
  return p_team_id;
end;
$$;

revoke all on function public.set_team_visibility(uuid, boolean, text) from anon, public;
revoke all on function public.list_public_teams(text) from anon, public;
revoke all on function public.join_public_team(uuid, text) from anon, public;
grant execute on function public.set_team_visibility(uuid, boolean, text) to authenticated;
grant execute on function public.list_public_teams(text) to authenticated;
grant execute on function public.join_public_team(uuid, text) to authenticated;

create table if not exists public.team_messages (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint team_messages_body_length check (char_length(btrim(body)) between 1 and 1000),
  constraint team_messages_name_length check (char_length(btrim(display_name)) between 1 and 40)
);

create index if not exists team_messages_team_created_idx on public.team_messages (team_id, created_at desc);

alter table public.team_messages enable row level security;
revoke all on table public.team_messages from anon, authenticated, public;
grant select, insert, delete on table public.team_messages to authenticated;

drop policy if exists "team_messages_select_members" on public.team_messages;
create policy "team_messages_select_members"
on public.team_messages for select
to authenticated
using (team_id in (select public.current_team_ids()));

drop policy if exists "team_messages_insert_members" on public.team_messages;
create policy "team_messages_insert_members"
on public.team_messages for insert
to authenticated
with check (user_id = (select auth.uid()) and team_id in (select public.current_team_ids()));

-- Your own words, or anything in a team you lead.
drop policy if exists "team_messages_delete_author_or_leader" on public.team_messages;
create policy "team_messages_delete_author_or_leader"
on public.team_messages for delete
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.team_members m
    where m.team_id = team_messages.team_id and m.user_id = (select auth.uid()) and m.role = 'leader'
  )
);

create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.team_messages(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now(),
  constraint message_reports_reason_length check (char_length(reason) <= 200),
  constraint message_reports_once unique (message_id, reporter_id)
);

alter table public.message_reports enable row level security;
revoke all on table public.message_reports from anon, authenticated, public;
grant insert on table public.message_reports to authenticated;

drop policy if exists "message_reports_insert_members" on public.message_reports;
create policy "message_reports_insert_members"
on public.message_reports for insert
to authenticated
with check (
  reporter_id = (select auth.uid())
  and exists (select 1 from public.team_messages msg where msg.id = message_id and msg.team_id in (select public.current_team_ids()))
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'team_messages'
  ) then
    alter publication supabase_realtime add table public.team_messages;
  end if;
end $$;
