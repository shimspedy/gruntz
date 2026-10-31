-- The profile photo is now kept for every signed-in athlete, not only while on a
-- team, so it can come back after a reinstall or on a new phone. Teammates keep
-- their existing read access through "team_avatars_select_team"; this adds the
-- owner's own read access for when they are on no team.
--
-- Write access is unchanged: an authenticated user can only write `<their uid>.jpg`,
-- the bucket is private, limited to 1 MB and image/jpeg.
drop policy if exists "team_avatars_select_own" on storage.objects;
create policy "team_avatars_select_own"
on storage.objects for select
to authenticated
using (bucket_id = 'team-avatars' and name = (select auth.uid())::text || '.jpg');
