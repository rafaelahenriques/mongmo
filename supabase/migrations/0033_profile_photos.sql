-- Profile photos, shown on the leaderboard.
--
-- 1. A private `avatars` bucket. Each person writes and deletes only in
--    their own folder (avatars/<user id>/...). A photo is seen by its owner,
--    and by other members only while it is the person's current photo and
--    they are on the leaderboard (that's opt-in, 0028). The app shows photos
--    through short-lived signed links, like challenge photos.
-- 2. profiles.avatar_path: the current photo, always in the person's own
--    folder. Only they can set it.
-- 3. leaderboard() returns it with each row.
-- 4. Deleting an account waits until these files are gone too (0020), and
--    retention_avatar_paths() lists the files the retention job removes:
--    expired accounts' photos, and photos nobody uses any more.
-- Idempotent.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 5 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

alter table public.profiles add column if not exists avatar_path text;

-- "<their id>/<file name>": nobody can point at a file outside their folder.
alter table public.profiles drop constraint if exists profiles_avatar_path_check;
alter table public.profiles add constraint profiles_avatar_path_check
  check (
    avatar_path is null
    or (
      split_part(avatar_path, '/', 1) = id::text
      and avatar_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9_-][A-Za-z0-9._-]{0,99}$'
    )
  );

create index if not exists profiles_avatar_path_idx on public.profiles (avatar_path) where avatar_path is not null;

grant update (avatar_path) on public.profiles to authenticated;

-- Whether a file is someone's current photo and they're on the leaderboard.
create or replace function public.is_leaderboard_avatar(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where avatar_path = p_path and leaderboard_visible
  );
$$;

revoke execute on function public.is_leaderboard_avatar(text) from public, anon;
grant execute on function public.is_leaderboard_avatar(text) to authenticated;

drop policy if exists "avatars readable" on storage.objects;
create policy "avatars readable" on storage.objects
  for select to authenticated using (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_leaderboard_avatar(name)
    )
  );

drop policy if exists "avatars insert own folder" on storage.objects;
create policy "avatars insert own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars delete own folder" on storage.objects;
create policy "avatars delete own folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- The return type changes, so the function is dropped and made again.
drop function if exists public.leaderboard(text);
create function public.leaderboard(p_period text default 'all')
returns table (user_id uuid, name text, points bigint, avatar_path text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, coalesce(sum(pe.points), 0)::bigint as points, p.avatar_path
  from public.profiles p
  left join public.point_events pe on pe.user_id = p.id
   and (p_period <> 'weekly' or pe.created_at >= now() - interval '7 days')
  where p.leaderboard_visible
  group by p.id, p.name, p.avatar_path
  order by points desc, p.name asc;
$$;

revoke execute on function public.leaderboard(text) from public, anon;
grant execute on function public.leaderboard(text) to authenticated;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Not signed in';
  end if;

  if exists (
    select 1 from storage.objects
    where bucket_id in ('challenge-photos', 'avatars') and (storage.foldername(name))[1] = v_user::text
  ) then
    raise exception 'Your photos are still being deleted. Try again.';
  end if;

  update public.events set created_by = null where created_by = v_user;
  delete from public.orders where user_id = v_user;
  -- Cascades: profiles → check_ins, challenge_completions, photos,
  -- user_badges, point_events, user_rewards; orders → order_items.
  delete from auth.users where id = v_user;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Profile photo files the retention job removes: those of accounts it is
-- about to delete, and any that are nobody's current photo (replaced, or
-- left by a deleted account) once a day old, so an upload whose profile
-- isn't saved yet is left alone.
create or replace function public.retention_avatar_paths(p_now timestamptz default now())
returns table (path text)
language sql
stable
security definer
set search_path = public
as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'avatars'
    and (
      (storage.foldername(o.name))[1] in (select id::text from public.retention_expired_accounts(p_now))
      or (
        o.created_at < p_now - interval '1 day'
        and not exists (select 1 from public.profiles p where p.avatar_path = o.name)
      )
    );
$$;

revoke execute on function public.retention_avatar_paths(timestamptz) from public, anon, authenticated;
grant execute on function public.retention_avatar_paths(timestamptz) to service_role;
