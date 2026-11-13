-- Three things found by a pre-launch audit:
--   1. Foreign keys without an index: a join, or a delete on the row they
--      point at, read the whole table.
--   2. Row level security policies that called auth.uid() and is_owner()
--      once for every row. Wrapped in a sub-select, Postgres works them
--      out once per query. The rules themselves are unchanged.
--   3. Two small tables only the payment Edge Functions (the service
--      role) use: Stripe events already handled, and a rate limit.

-- 1. An index for every foreign key that lacked one. ------------------------

create index if not exists stores_menu_id_idx on public.stores (menu_id);
create index if not exists events_created_by_idx on public.events (created_by);
create index if not exists event_menus_menu_id_idx on public.event_menus (menu_id);
create index if not exists challenge_completions_challenge_id_idx on public.challenge_completions (challenge_id);
create index if not exists photos_user_id_idx on public.photos (user_id);
create index if not exists photos_challenge_id_idx on public.photos (challenge_id);
create index if not exists user_badges_badge_id_idx on public.user_badges (badge_id);
create index if not exists user_rewards_reward_id_idx on public.user_rewards (reward_id);
create index if not exists orders_store_id_idx on public.orders (store_id);
create index if not exists orders_event_id_idx on public.orders (event_id);
create index if not exists orders_user_reward_id_idx on public.orders (user_reward_id);
create index if not exists order_items_menu_item_id_idx on public.order_items (menu_item_id);
create index if not exists rewards_min_level_idx on public.rewards (min_level);
create index if not exists photo_reports_reporter_id_idx on public.photo_reports (reporter_id);
create index if not exists profile_photo_reports_reporter_id_idx on public.profile_photo_reports (reporter_id);

-- 2. The same policies, with auth.uid() and is_owner() worked out once. -----

alter policy "profiles select own" on public.profiles
  using ((select auth.uid()) = id or (select public.is_owner()));

alter policy "profiles update own" on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

alter policy "check ins select own" on public.check_ins
  using ((select auth.uid()) = user_id or (select public.is_owner()));

alter policy "challenge completions select own" on public.challenge_completions
  using ((select auth.uid()) = user_id or (select public.is_owner()));

alter policy "user badges select own" on public.user_badges
  using ((select auth.uid()) = user_id);

alter policy "point events select own" on public.point_events
  using ((select auth.uid()) = user_id);

alter policy "user rewards select own" on public.user_rewards
  using ((select auth.uid()) = user_id);

alter policy "orders select own" on public.orders
  using ((select auth.uid()) = user_id or (select public.is_owner()));

alter policy "order items select own" on public.order_items
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = (select auth.uid()) or (select public.is_owner()))
    )
  );

alter policy "photos select own or staff" on public.photos
  using ((select auth.uid()) = user_id or (select public.is_owner()));

alter policy "photos insert own" on public.photos
  with check (
    (select auth.uid()) = user_id
    and storage_path like ((select auth.uid())::text || '/%')
    and shared_at is null
    and removed_at is null
  );

alter policy "challenge photos readable" on storage.objects
  using (
    bucket_id = 'challenge-photos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_owner())
      or public.is_photo_of_the_week(name)
    )
  );

alter policy "challenge photos insert own folder" on storage.objects
  with check (bucket_id = 'challenge-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter policy "challenge photos delete own folder" on storage.objects
  using (bucket_id = 'challenge-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter policy "avatars readable" on storage.objects
  using (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_leaderboard_avatar(name)
      or ((select public.is_owner()) and public.is_reported_avatar(name))
    )
  );

alter policy "avatars insert own folder" on storage.objects
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter policy "avatars delete own folder" on storage.objects
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 3a. Stripe events already handled. ----------------------------------------
-- Stripe sends an event again when it gets no answer, and sometimes twice
-- anyway. The handlers were already safe to repeat; this stops the repeat
-- and leaves a record of what each event did. No personal data: Stripe's
-- event id, its type and the outcome. Kept 90 days.

create table if not exists public.stripe_events (
  id text primary key check (length(id) between 1 and 255),
  type text not null check (length(type) between 1 and 100),
  outcome text not null check (length(outcome) between 1 and 200),
  received_at timestamptz not null default now()
);

create index if not exists stripe_events_received_at_idx on public.stripe_events (received_at);

-- Row level security on with no policy: nobody but the service role.
alter table public.stripe_events enable row level security;
revoke all on public.stripe_events from anon, authenticated;

create or replace function public.stripe_event_seen(p_event_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.stripe_events where id = p_event_id);
$$;

create or replace function public.record_stripe_event(p_event_id text, p_type text, p_outcome text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.stripe_events (id, type, outcome)
  values (p_event_id, p_type, left(p_outcome, 200))
  on conflict (id) do nothing;
  delete from public.stripe_events where received_at < now() - interval '90 days';
end;
$$;

-- 3b. A rate limit for the functions that start payments and refunds. -------
-- One row per person, action and time window, counted up; a day's worth is
-- kept. Deleted with the account.

create table if not exists public.rate_limits (
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null check (length(action) between 1 and 50),
  window_start timestamptz not null,
  count integer not null default 1 check (count > 0),
  primary key (user_id, action, window_start)
);

create index if not exists rate_limits_window_start_idx on public.rate_limits (window_start);

alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

-- Counts this call and says whether it's still within p_max per window.
create or replace function public.take_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz;
  v_count integer;
begin
  if p_max < 1 or p_window_seconds < 1 then
    raise exception 'A rate limit needs a positive maximum and window' using errcode = '22023';
  end if;
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limits as r (user_id, action, window_start)
  values (p_user_id, p_action, v_window)
  on conflict (user_id, action, window_start) do update set count = r.count + 1
  returning r.count into v_count;

  delete from public.rate_limits where window_start < now() - interval '1 day';
  return v_count <= p_max;
end;
$$;

revoke all on function public.stripe_event_seen(text) from public, anon, authenticated;
revoke all on function public.record_stripe_event(text, text, text) from public, anon, authenticated;
revoke all on function public.take_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.stripe_event_seen(text) to service_role;
grant execute on function public.record_stripe_event(text, text, text) to service_role;
grant execute on function public.take_rate_limit(uuid, text, integer, integer) to service_role;
