-- Team members may show each other a profile photo.
--
-- The photo itself lives in a private storage bucket under `<user_id>.jpg`. Only
-- the owner can write it, and only current teammates can read it, so leaving a
-- team also ends access to the photo. `avatar_version` on the roster row says
-- whether a photo exists and changes with each upload, so clients know when to
-- fetch a new one.

alter table public.team_members
  add column if not exists avatar_version integer not null default 0;

create or replace function public.set_team_avatar_version(p_version integer)
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
  set avatar_version = greatest(0, p_version),
      updated_at = now()
  where user_id = caller;
end;
$$;

revoke all on function public.set_team_avatar_version(integer) from anon, public;
grant execute on function public.set_team_avatar_version(integer) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('team-avatars', 'team-avatars', false, 1048576, array['image/jpeg'])
on conflict (id) do nothing;

drop policy if exists "team_avatars_insert_own" on storage.objects;
create policy "team_avatars_insert_own"
on storage.objects for insert
to authenticated
with check (bucket_id = 'team-avatars' and name = (select auth.uid())::text || '.jpg');

drop policy if exists "team_avatars_update_own" on storage.objects;
create policy "team_avatars_update_own"
on storage.objects for update
to authenticated
using (bucket_id = 'team-avatars' and name = (select auth.uid())::text || '.jpg')
with check (bucket_id = 'team-avatars' and name = (select auth.uid())::text || '.jpg');

drop policy if exists "team_avatars_delete_own" on storage.objects;
create policy "team_avatars_delete_own"
on storage.objects for delete
to authenticated
using (bucket_id = 'team-avatars' and name = (select auth.uid())::text || '.jpg');

-- Teammates only. The owner is a member of their own team, so this covers them too.
drop policy if exists "team_avatars_select_team" on storage.objects;
create policy "team_avatars_select_team"
on storage.objects for select
to authenticated
using (
  bucket_id = 'team-avatars'
  and exists (
    select 1 from public.team_members m
    where m.team_id = (select public.current_team_id())
      and m.user_id::text || '.jpg' = storage.objects.name
  )
);
