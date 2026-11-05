-- Challenge photos are private, with "Photos of the week" by choice.
--
-- Until now every signed-in member could read every photo record, and
-- every photo file. Now only the person who took a photo, and Mongmo staff,
-- can see it. A person can choose to share one in "Photos of the week" (the
-- app asks right after the photo is taken): other members then see it,
-- without a name, for seven days. They can stop sharing at any time.
-- Anyone can report a shared photo: it comes down at once and can't be
-- shared again, and staff can read the reports.

alter table public.photos
  add column if not exists shared_at timestamptz,
  add column if not exists removed_at timestamptz;

-- Photo records: the person and staff. Shared photos are read through
-- photos_of_the_week(), which leaves out who took them.
drop policy if exists "photos readable" on public.photos;
drop policy if exists "photos select own or staff" on public.photos;
create policy "photos select own or staff" on public.photos
  for select to authenticated using (auth.uid() = user_id or public.is_owner());

-- New records start private; sharing goes through set_photo_shared().
drop policy if exists "photos insert own" on public.photos;
create policy "photos insert own" on public.photos
  for insert to authenticated with check (
    auth.uid() = user_id
    and storage_path like auth.uid()::text || '/%'
    and shared_at is null
    and removed_at is null
  );

-- Whether a photo file is in this week's highlights (for the storage rule).
create or replace function public.is_photo_of_the_week(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.photos
    where storage_path = p_path
      and shared_at > now() - interval '7 days'
      and removed_at is null
  );
$$;

-- Photo files: the person's own folder, staff, or a photo of the week.
drop policy if exists "challenge photos readable" on storage.objects;
create policy "challenge photos readable" on storage.objects
  for select to authenticated using (
    bucket_id = 'challenge-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_owner()
      or public.is_photo_of_the_week(name)
    )
  );

create table if not exists public.photo_reports (
  photo_id uuid not null references public.photos (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (photo_id, reporter_id)
);
alter table public.photo_reports enable row level security;
drop policy if exists "photo reports staff read" on public.photo_reports;
create policy "photo reports staff read" on public.photo_reports
  for select to authenticated using (public.is_owner());

-- Share a photo you took in the last week, or stop sharing it.
create or replace function public.set_photo_shared(p_photo_id uuid, p_shared boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_photo public.photos%rowtype;
begin
  select * into v_photo from public.photos where id = p_photo_id and user_id = auth.uid();
  if not found then
    raise exception 'That photo couldn''t be found' using errcode = 'P0002';
  end if;
  if p_shared then
    if v_photo.removed_at is not null then
      raise exception 'This photo was taken out of Photos of the week, so it can''t be shared again';
    end if;
    if v_photo.created_at < now() - interval '7 days' then
      raise exception 'Only photos from the last week can be shared';
    end if;
  end if;
  update public.photos
     set shared_at = case when p_shared then coalesce(v_photo.shared_at, now()) else null end
   where id = p_photo_id;
end;
$$;

-- Report a photo of the week: it comes down for everyone, at once.
create or replace function public.report_photo(p_photo_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.photos
    where id = p_photo_id and shared_at > now() - interval '7 days' and removed_at is null
  ) then
    raise exception 'That photo couldn''t be found' using errcode = 'P0002';
  end if;
  insert into public.photo_reports (photo_id, reporter_id)
  values (p_photo_id, auth.uid())
  on conflict do nothing;
  update public.photos set shared_at = null, removed_at = now() where id = p_photo_id;
end;
$$;

-- This week's shared photos, newest first, without who took them
-- (`mine` lets the app offer "Stop sharing" on your own).
create or replace function public.photos_of_the_week()
returns table (id uuid, storage_path text, event_id uuid, event_title text, shared_at timestamptz, mine boolean)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.storage_path, p.event_id, e.title, p.shared_at, p.user_id = auth.uid()
  from public.photos p
  join public.events e on e.id = p.event_id
  where p.shared_at > now() - interval '7 days'
    and p.removed_at is null
  order by p.shared_at desc
  limit 30;
$$;

revoke execute on function public.is_photo_of_the_week(text) from public, anon;
revoke execute on function public.set_photo_shared(uuid, boolean) from public, anon;
revoke execute on function public.report_photo(uuid) from public, anon;
revoke execute on function public.photos_of_the_week() from public, anon;
grant execute on function public.is_photo_of_the_week(text) to authenticated;
grant execute on function public.set_photo_shared(uuid, boolean) to authenticated;
grant execute on function public.report_photo(uuid) to authenticated;
grant execute on function public.photos_of_the_week() to authenticated;

-- The export says which photos are shared or were taken down.
create or replace function public.export_my_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Not signed in';
  end if;

  return jsonb_build_object(
    'exported_at', now(),
    'account', (
      select jsonb_build_object(
        'id', u.id,
        'email', u.email,
        'guest', coalesce(u.is_anonymous, false),
        'created_at', u.created_at,
        'last_sign_in_at', u.last_sign_in_at
      )
      from auth.users u where u.id = v_user
    ),
    'profile', (
      select to_jsonb(p) - 'role' || jsonb_build_object('role', p.role)
      from public.profiles p where p.id = v_user
    ),
    'orders', coalesce((
      select jsonb_agg(
        to_jsonb(o) || jsonb_build_object(
          'items', coalesce((
            select jsonb_agg(to_jsonb(i) - 'order_id' order by i.name_snapshot)
            from public.order_items i where i.order_id = o.id
          ), '[]'::jsonb)
        ) order by o.created_at
      )
      from public.orders o where o.user_id = v_user
    ), '[]'::jsonb),
    'points', coalesce((
      select jsonb_agg(to_jsonb(e) - 'user_id' order by e.created_at)
      from public.point_events e where e.user_id = v_user
    ), '[]'::jsonb),
    'badges', coalesce((
      select jsonb_agg(jsonb_build_object('badge', b.title, 'earned_at', ub.earned_at) order by ub.earned_at)
      from public.user_badges ub join public.badges b on b.id = ub.badge_id
      where ub.user_id = v_user
    ), '[]'::jsonb),
    'rewards', coalesce((
      select jsonb_agg(
        jsonb_build_object('reward', r.title, 'redeemed_at', ur.redeemed_at, 'used_at', ur.used_at)
        order by ur.redeemed_at
      )
      from public.user_rewards ur join public.rewards r on r.id = ur.reward_id
      where ur.user_id = v_user
    ), '[]'::jsonb),
    'check_ins', coalesce((
      select jsonb_agg(
        jsonb_build_object('pop_up', e.title, 'checked_in_at', c.checked_in_at, 'by_qr_code', c.verified_by_qr)
        order by c.checked_in_at
      )
      from public.check_ins c join public.events e on e.id = c.event_id
      where c.user_id = v_user
    ), '[]'::jsonb),
    'challenge_results', coalesce((
      select jsonb_agg(
        jsonb_build_object('challenge', ch.title, 'completed_at', cc.completed_at, 'result', cc.data)
        order by cc.completed_at
      )
      from public.challenge_completions cc join public.challenges ch on ch.id = cc.challenge_id
      where cc.user_id = v_user
    ), '[]'::jsonb),
    'photos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'file', ph.storage_path, 'taken_at', ph.created_at,
        'shared_in_photos_of_the_week_at', ph.shared_at, 'taken_down_at', ph.removed_at
      ) order by ph.created_at)
      from public.photos ph where ph.user_id = v_user
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
