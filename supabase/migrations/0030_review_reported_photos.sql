-- Staff review reported photos (Owner tools → Reported photos).
--
-- A report takes a photo of the week down at once (0029). Staff then
-- decide:
--   put it back:  it shows again for what's left of its seven days;
--   keep it down: the person keeps it privately; it can't be shared again;
--   delete it:    the file (the app removes it first) and its record go.
-- Once decided, the reports are deleted: who reported what isn't kept
-- longer than the review needs. The photo keeps the outcome, which the
-- person sees in their data export.

alter table public.photos
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_outcome text;
alter table public.photos drop constraint if exists photos_review_outcome_check;
alter table public.photos add constraint photos_review_outcome_check
  check (review_outcome is null or review_outcome in ('restored', 'kept_down'));

-- A report no longer clears shared_at, so putting a photo back can restore
-- it; removed_at alone keeps it out of Photos of the week. A new report
-- reopens a photo that was put back.
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
  update public.photos
     set removed_at = now(), reviewed_at = null, review_outcome = null
   where id = p_photo_id;
end;
$$;

-- Staff: photos waiting for a decision, oldest first. Empty for anyone else.
create or replace function public.reported_photos()
returns table (id uuid, storage_path text, event_title text, taken_at timestamptz, removed_at timestamptz, reports integer)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.storage_path, e.title, p.created_at, p.removed_at,
         (select count(*)::integer from public.photo_reports r where r.photo_id = p.id)
  from public.photos p
  join public.events e on e.id = p.event_id
  where public.is_owner()
    and p.removed_at is not null
    and p.reviewed_at is null
  order by p.removed_at;
$$;

-- Staff: put a reported photo back, or keep it down.
create or replace function public.review_reported_photo(p_photo_id uuid, p_restore boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_owner() then
    raise exception 'Only Mongmo staff can review reports' using errcode = '42501';
  end if;
  update public.photos
     set removed_at = case when p_restore then null else removed_at end,
         reviewed_at = now(),
         review_outcome = case when p_restore then 'restored' else 'kept_down' end
   where id = p_photo_id and removed_at is not null and reviewed_at is null;
  if not found then
    raise exception 'Someone already dealt with that report' using errcode = 'P0002';
  end if;
  delete from public.photo_reports where photo_id = p_photo_id;
end;
$$;

-- Staff: delete a reported photo's record (and with it its reports), once
-- the app has removed the file.
create or replace function public.delete_reported_photo(p_photo_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_owner() then
    raise exception 'Only Mongmo staff can review reports' using errcode = '42501';
  end if;
  delete from public.photos where id = p_photo_id and removed_at is not null;
  if not found then
    raise exception 'That photo couldn''t be found' using errcode = 'P0002';
  end if;
end;
$$;

-- Whether a file belongs to a photo that was taken down (for the rule below).
create or replace function public.is_taken_down_photo(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.photos where storage_path = p_path and removed_at is not null);
$$;

-- Staff may delete the file of a photo that was taken down, and only those.
drop policy if exists "challenge photos staff delete taken down" on storage.objects;
create policy "challenge photos staff delete taken down" on storage.objects
  for delete to authenticated using (
    bucket_id = 'challenge-photos' and public.is_owner() and public.is_taken_down_photo(name)
  );

revoke execute on function public.reported_photos() from public, anon;
revoke execute on function public.review_reported_photo(uuid, boolean) from public, anon;
revoke execute on function public.delete_reported_photo(uuid) from public, anon;
revoke execute on function public.is_taken_down_photo(text) from public, anon;
grant execute on function public.reported_photos() to authenticated;
grant execute on function public.review_reported_photo(uuid, boolean) to authenticated;
grant execute on function public.delete_reported_photo(uuid) to authenticated;
grant execute on function public.is_taken_down_photo(text) to authenticated;

-- The export says what happened to a reported photo.
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
        'shared_in_photos_of_the_week_at', ph.shared_at, 'taken_down_at', ph.removed_at,
        'review_outcome', ph.review_outcome
      ) order by ph.created_at)
      from public.photos ph where ph.user_id = v_user
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
