-- Reporting a profile photo (the leaderboard, 0033).
--
-- Any member can report someone else's photo on the leaderboard. It's
-- hidden from everyone else at once (the person still sees it, and is told
-- why), and staff decide in Owner tools → Reported photos:
--   put it back:   it shows again;
--   remove photo:  the file (the app deletes it first) and the link to it go.
-- Once decided, the reports are deleted: who reported whom isn't kept
-- longer than the review needs. A new photo while one is hidden stays
-- hidden too, until staff have looked.
-- Idempotent.

alter table public.profiles add column if not exists avatar_hidden_at timestamptz;

create table if not exists public.profile_photo_reports (
  user_id uuid not null references public.profiles (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, reporter_id)
);
alter table public.profile_photo_reports enable row level security;
-- No policies: only the functions below read or write it.
revoke all on public.profile_photo_reports from anon, authenticated;

-- A hidden photo isn't anyone's to see but its owner's (and staff's, below).
create or replace function public.is_leaderboard_avatar(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where avatar_path = p_path and leaderboard_visible and avatar_hidden_at is null
  );
$$;

-- Whether a file is a profile photo hidden after a report (for staff).
create or replace function public.is_reported_avatar(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where avatar_path = p_path and avatar_hidden_at is not null
  );
$$;

revoke execute on function public.is_reported_avatar(text) from public, anon;
grant execute on function public.is_reported_avatar(text) to authenticated;

drop policy if exists "avatars readable" on storage.objects;
create policy "avatars readable" on storage.objects
  for select to authenticated using (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_leaderboard_avatar(name)
      or (public.is_owner() and public.is_reported_avatar(name))
    )
  );

drop policy if exists "avatars staff delete reported" on storage.objects;
create policy "avatars staff delete reported" on storage.objects
  for delete to authenticated using (
    bucket_id = 'avatars' and public.is_owner() and public.is_reported_avatar(name)
  );

-- Same columns as 0033: a hidden photo comes back as none.
create or replace function public.leaderboard(p_period text default 'all')
returns table (user_id uuid, name text, points bigint, avatar_path text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, coalesce(sum(pe.points), 0)::bigint as points,
         case when p.avatar_hidden_at is null then p.avatar_path end
  from public.profiles p
  left join public.point_events pe on pe.user_id = p.id
   and (p_period <> 'weekly' or pe.created_at >= now() - interval '7 days')
  where p.leaderboard_visible
  group by p.id, p.name, p.avatar_path, p.avatar_hidden_at
  order by points desc, p.name asc;
$$;

revoke execute on function public.leaderboard(text) from public, anon;
grant execute on function public.leaderboard(text) to authenticated;

-- Report someone's photo on the leaderboard: hidden at once.
create or replace function public.report_profile_photo(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reporter uuid := auth.uid();
begin
  if v_reporter is null then
    raise exception 'Not signed in';
  end if;
  if p_user_id = v_reporter then
    raise exception 'That''s your own photo' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = p_user_id and leaderboard_visible and avatar_path is not null
  ) then
    raise exception 'That photo couldn''t be found' using errcode = 'P0002';
  end if;
  insert into public.profile_photo_reports (user_id, reporter_id)
  values (p_user_id, v_reporter)
  on conflict do nothing;
  update public.profiles
     set avatar_hidden_at = coalesce(avatar_hidden_at, now())
   where id = p_user_id;
end;
$$;

-- Staff: hidden profile photos waiting for a decision, oldest first. Empty for anyone else.
create or replace function public.reported_profile_photos()
returns table (user_id uuid, name text, avatar_path text, hidden_at timestamptz, reports integer)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.avatar_path, p.avatar_hidden_at,
         (select count(*)::integer from public.profile_photo_reports r where r.user_id = p.id)
  from public.profiles p
  where public.is_owner()
    and p.avatar_hidden_at is not null
  order by p.avatar_hidden_at;
$$;

-- Staff: put a hidden photo back, or remove it (once the app has deleted the file).
create or replace function public.review_reported_profile_photo(p_user_id uuid, p_restore boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_owner() then
    raise exception 'Only Mongmo staff can review reports' using errcode = '42501';
  end if;
  update public.profiles
     set avatar_hidden_at = null,
         avatar_path = case when p_restore then avatar_path end
   where id = p_user_id and avatar_hidden_at is not null;
  if not found then
    raise exception 'Someone already dealt with that report' using errcode = 'P0002';
  end if;
  delete from public.profile_photo_reports where user_id = p_user_id;
end;
$$;

revoke execute on function public.report_profile_photo(uuid) from public, anon;
revoke execute on function public.reported_profile_photos() from public, anon;
revoke execute on function public.review_reported_profile_photo(uuid, boolean) from public, anon;
grant execute on function public.report_profile_photo(uuid) to authenticated;
grant execute on function public.reported_profile_photos() to authenticated;
grant execute on function public.review_reported_profile_photo(uuid, boolean) to authenticated;
