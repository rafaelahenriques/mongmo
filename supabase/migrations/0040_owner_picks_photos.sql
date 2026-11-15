-- Photos of the week, chosen by staff.
--
-- Until now a photo a member shared went straight into Photos of the week
-- for seven days. Now sharing offers it: staff look through what was
-- offered and pick the ones to show, within 30 days of the offer. A picked
-- photo shows for seven days from when it was picked. Everything else is
-- as before: the member can stop sharing at any time (it comes down at
-- once), anyone can report a photo that's showing (down at once, staff
-- review it), and nobody sees who took a photo.
--
-- Photos shared before this migration become offers too: none shows until
-- staff pick it.
--
--   shared_at    the member offered it (and still does)
--   featured_at  staff picked it; shows until seven days after
--   removed_at   taken down after a report

alter table public.photos add column if not exists featured_at timestamptz;

comment on column public.photos.featured_at is
  'When staff picked this photo for Photos of the week; it shows for seven days from then.';

-- What's showing: picked in the last week, still offered, not taken down.
create index if not exists photos_featured_at_idx on public.photos (featured_at) where featured_at is not null;

-- Whether a photo file is showing in Photos of the week (for the storage
-- rule: that's when other members may open the file).
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
      and featured_at > now() - interval '7 days'
      and shared_at is not null
      and removed_at is null
  );
$$;

-- Offer a photo you took in the last week, or take the offer back. Taking
-- it back also takes it out of Photos of the week if it was showing.
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
     set shared_at = case when p_shared then coalesce(v_photo.shared_at, now()) else null end,
         featured_at = case when p_shared then featured_at else null end
   where id = p_photo_id;
end;
$$;

-- Report a photo that's showing: it comes down for everyone, at once.
create or replace function public.report_photo(p_photo_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.photos
    where id = p_photo_id
      and featured_at > now() - interval '7 days'
      and shared_at is not null
      and removed_at is null
  ) then
    raise exception 'That photo couldn''t be found' using errcode = 'P0002';
  end if;
  insert into public.photo_reports (photo_id, reporter_id)
  values (p_photo_id, auth.uid())
  on conflict do nothing;
  update public.photos
     set removed_at = now(), reviewed_at = null, review_outcome = null
   where id = p_photo_id;
end;
$$;

-- This week's picked photos, newest pick first, without who took them
-- (`mine` lets the app offer "Stop sharing" on your own). The same columns
-- as before, so app versions already on phones keep working: `shared_at`
-- is now when the photo was picked.
create or replace function public.photos_of_the_week()
returns table (id uuid, storage_path text, event_id uuid, event_title text, shared_at timestamptz, mine boolean)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.storage_path, p.event_id, e.title, p.featured_at, p.user_id = auth.uid()
  from public.photos p
  join public.events e on e.id = p.event_id
  where p.featured_at > now() - interval '7 days'
    and p.shared_at is not null
    and p.removed_at is null
  order by p.featured_at desc
  limit 30;
$$;

-- For staff: the photos members are offering (offered in the last 30
-- days, or showing now), the ones not picked yet first. No names here
-- either.
create or replace function public.offered_photos()
returns table (
  id uuid,
  storage_path text,
  event_title text,
  shared_at timestamptz,
  featured_at timestamptz,
  showing boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.storage_path, e.title, p.shared_at, p.featured_at,
         coalesce(p.featured_at > now() - interval '7 days', false)
  from public.photos p
  join public.events e on e.id = p.event_id
  where public.is_owner()
    and p.shared_at is not null
    and p.removed_at is null
    and (p.shared_at > now() - interval '30 days' or p.featured_at > now() - interval '7 days')
  order by coalesce(p.featured_at > now() - interval '7 days', false), p.shared_at desc
  limit 120;
$$;

-- Staff pick a photo for Photos of the week (within 30 days of the member
-- offering it), or take it out again.
create or replace function public.set_photo_featured(p_photo_id uuid, p_featured boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_owner() then
    raise exception 'Only Mongmo staff can choose Photos of the week' using errcode = '42501';
  end if;
  update public.photos
     set featured_at = case when p_featured then now() else null end
   where id = p_photo_id
     and shared_at is not null
     and removed_at is null
     and (not p_featured or shared_at > now() - interval '30 days');
  if not found then
    raise exception 'That photo isn''t being shared any more' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.is_photo_of_the_week(text) from public, anon;
revoke execute on function public.set_photo_shared(uuid, boolean) from public, anon;
revoke execute on function public.report_photo(uuid) from public, anon;
revoke execute on function public.photos_of_the_week() from public, anon;
revoke execute on function public.offered_photos() from public, anon;
revoke execute on function public.set_photo_featured(uuid, boolean) from public, anon;
grant execute on function public.is_photo_of_the_week(text) to authenticated;
grant execute on function public.set_photo_shared(uuid, boolean) to authenticated;
grant execute on function public.report_photo(uuid) to authenticated;
grant execute on function public.photos_of_the_week() to authenticated;
grant execute on function public.offered_photos() to authenticated;
grant execute on function public.set_photo_featured(uuid, boolean) to authenticated;

-- A member can't pick their own photo by writing to the table. Photos have
-- no update policy (0029), so only the functions above change a row; and a
-- new row can't arrive already picked (as 0038's policy, plus featured_at).
alter policy "photos insert own" on public.photos
  with check (
    (select auth.uid()) = user_id
    and storage_path like ((select auth.uid())::text || '/%')
    and shared_at is null
    and removed_at is null
    and featured_at is null
  );

-- The export says when a photo was picked. As 0030, plus that one field.
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
        'shared_in_photos_of_the_week_at', ph.shared_at,
        'picked_for_photos_of_the_week_at', ph.featured_at, 'taken_down_at', ph.removed_at,
        'review_outcome', ph.review_outcome
      ) order by ph.created_at)
      from public.photos ph where ph.user_id = v_user
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
