-- Progress backup and restore for Gruntz.
--
-- Gruntz is an offline-first app: every store lives in AsyncStorage on the device
-- and the app never waits on the network to log a set. That stays true. This table
-- exists for one job — so that losing a phone, or getting a new one, does not
-- destroy someone's training history.
--
-- Signing up is optional and lives in the Profile tab, after the athlete already
-- has something worth keeping. Nobody is asked to create an account to train.
--
-- One row per athlete holding a whole snapshot, rather than a table per store.
-- Restore replaces local state wholesale, so there is nothing to merge and nothing
-- to conflict: the shape that would need normalising is the shape we deliberately
-- do not have. Every store is capped on device (300 entries per exercise, 400
-- exercises, 180 check-ins, 400 tracked sessions, 400 notes), so a realistic
-- snapshot is a couple of megabytes.

create table if not exists public.backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  -- The snapshot. `schema_version` is what lets an older app refuse a payload it
  -- would misread, rather than silently restoring a shape it does not understand.
  payload jsonb not null,
  schema_version integer not null default 1,
  -- Context for the restore screen: "Backup from your iPhone, 3 days ago".
  app_version text,
  device_label text,
  workout_count integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint backups_schema_version_positive check (schema_version > 0),
  constraint backups_workout_count_positive check (workout_count >= 0)
);

alter table public.backups enable row level security;

-- Granted explicitly, so this project can keep "Automatically expose new tables"
-- turned OFF. With that setting on, every future table reaches the Data API the
-- moment it exists, and a table nobody remembered to lock down is exposed by
-- default. Note `anon` gets nothing at all: a backup is only ever readable or
-- writable by the signed-in athlete it belongs to, and RLS below narrows these
-- grants to that athlete's own row.
grant select, insert, update, delete on table public.backups to authenticated;

-- An athlete can only ever see and write their own backup. There is no shared or
-- aggregate read path here by design: this table holds training history, which is
-- health-adjacent, and nothing in the app needs to read across athletes.
drop policy if exists "backups_select_own" on public.backups;
create policy "backups_select_own"
on public.backups for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "backups_insert_own" on public.backups;
create policy "backups_insert_own"
on public.backups for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "backups_update_own" on public.backups;
create policy "backups_update_own"
on public.backups for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Deleting your backup is a right, not a support ticket. Account deletion cascades
-- from auth.users above; this covers "stop backing me up" on its own.
drop policy if exists "backups_delete_own" on public.backups;
create policy "backups_delete_own"
on public.backups for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.touch_backups_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Set server-side: a device with a wrong clock must not be able to claim its
  -- backup is newer than it is, because that timestamp is what the restore screen
  -- shows and what a future sync would order by.
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists backups_touch_updated_at on public.backups;
create trigger backups_touch_updated_at
before insert or update on public.backups
for each row execute function public.touch_backups_updated_at();
