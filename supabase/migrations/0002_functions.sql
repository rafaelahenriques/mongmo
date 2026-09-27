-- Server-authoritative business logic. The client never decides on its own
-- that a user earned points, a badge, or a discount — everything below runs
-- as SECURITY DEFINER so it can be the only path that writes these rows.

-- ------------------------------------------------------------------
-- profiles: created automatically for every new auth user.
-- ------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url, home_city)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'home_city'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only an owner (or a trusted service-role script, e.g. bootstrapping the
-- very first owner — nobody can be "already an owner" before that exists)
-- may promote/demote a profile's role. A plain customer can never do this
-- via the anon/authenticated API surface.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.role() <> 'service_role'
     and not public.is_owner() then
    raise exception 'Only an owner can change a profile role';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ------------------------------------------------------------------
-- is_owner(): the single check every owner-only policy/RPC uses.
-- ------------------------------------------------------------------
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'owner'
  );
$$;

-- ------------------------------------------------------------------
-- Points ledger: every award/spend is one row, so a time window (the
-- weekly leaderboard) is a plain sum instead of a second source of truth.
-- ------------------------------------------------------------------
create or replace function public.award_challenge_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points integer;
begin
  select points into v_points from public.challenges where id = new.challenge_id;
  insert into public.point_events (user_id, points, source, source_id)
  values (new.user_id, coalesce(v_points, 0), 'challenge_completion', new.id);
  return new;
end;
$$;

create trigger challenge_completions_award_points
  after insert on public.challenge_completions
  for each row execute function public.award_challenge_points();

create or replace function public.award_badge_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points integer;
begin
  select points into v_points from public.badges where id = new.badge_id;
  insert into public.point_events (user_id, points, source, source_id)
  values (new.user_id, coalesce(v_points, 0), 'badge', new.id);
  return new;
end;
$$;

create trigger user_badges_award_points
  after insert on public.user_badges
  for each row execute function public.award_badge_points();

create or replace function public.my_points_balance()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(points), 0)::integer
  from public.point_events
  where user_id = auth.uid();
$$;

grant execute on function public.my_points_balance() to authenticated;

-- One call for the Profile screen's stats row (events attended, points,
-- badges, orders) — badges/points come from their own tables client-side.
create or replace function public.my_stats()
returns table (
  events_attended integer,
  cities_visited integer,
  challenges_completed integer,
  orders_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*)::integer from public.check_ins where user_id = auth.uid()),
    (
      select count(distinct e.city)::integer
      from public.check_ins c
      join public.events e on e.id = c.event_id
      where c.user_id = auth.uid()
    ),
    (select count(*)::integer from public.challenge_completions where user_id = auth.uid()),
    (
      select count(*)::integer from public.orders
      where user_id = auth.uid() and status not in ('draft', 'cancelled')
    );
$$;

grant execute on function public.my_stats() to authenticated;

-- ------------------------------------------------------------------
-- Badge evaluation: the fixed, developer-defined ladder. Re-run after
-- every check-in / challenge completion / paid order; already-earned
-- badges are skipped via the unique(user_id, badge_id) constraint.
-- ------------------------------------------------------------------
create or replace function public.award_badge(p_user uuid, p_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_badge_id uuid;
begin
  select id into v_badge_id from public.badges where key = p_key;
  if v_badge_id is null then
    return;
  end if;

  insert into public.user_badges (user_id, badge_id)
  values (p_user, v_badge_id)
  on conflict (user_id, badge_id) do nothing;
end;
$$;

create or replace function public.evaluate_badges(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_check_ins integer;
  v_completions integer;
  v_paid_orders integer;
  v_event_orders integer;
begin
  select count(*) into v_check_ins from public.check_ins where user_id = p_user;
  select count(*) into v_completions from public.challenge_completions where user_id = p_user;
  select count(*) into v_paid_orders
    from public.orders where user_id = p_user and status not in ('draft', 'cancelled');
  select count(distinct event_id) into v_event_orders
    from public.orders
    where user_id = p_user and status not in ('draft', 'cancelled') and event_id is not null;

  if v_check_ins >= 1 then perform public.award_badge(p_user, 'first-sip'); end if;
  if v_check_ins >= 2 then perform public.award_badge(p_user, 'popup-scout'); end if;
  if v_check_ins >= 4 then perform public.award_badge(p_user, 'street-food-fan'); end if;
  if v_check_ins >= 6 then perform public.award_badge(p_user, 'local-legend'); end if;
  if v_completions >= 3 then perform public.award_badge(p_user, 'memory-maker'); end if;
  if v_paid_orders >= 1 then perform public.award_badge(p_user, 'first-order'); end if;
  if v_paid_orders >= 3 then perform public.award_badge(p_user, 'regular'); end if;
  if v_event_orders >= 2 then perform public.award_badge(p_user, 'event-eater'); end if;
end;
$$;

-- ------------------------------------------------------------------
-- verify_check_in: the only way a check_ins row is created. Verifies the
-- event's QR token, that the event is currently running, and that the
-- device is within the geofence radius (haversine distance in meters).
-- ------------------------------------------------------------------
create or replace function public.verify_check_in(
  p_event_id uuid,
  p_qr_token text,
  p_latitude double precision,
  p_longitude double precision
)
returns public.check_ins
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events%rowtype;
  v_distance_m double precision;
  v_check_in public.check_ins%rowtype;
begin
  select * into v_event from public.events where id = p_event_id;
  if not found then
    raise exception 'Event not found';
  end if;

  if v_event.qr_token is distinct from p_qr_token then
    raise exception 'That QR code does not match this event';
  end if;

  if now() < v_event.starts_at or now() > v_event.ends_at then
    raise exception 'This event is not currently running';
  end if;

  v_distance_m := 2 * 6371000 * asin(sqrt(
    sin(radians(p_latitude - v_event.latitude) / 2) ^ 2 +
    cos(radians(v_event.latitude)) * cos(radians(p_latitude)) *
    sin(radians(p_longitude - v_event.longitude) / 2) ^ 2
  ));

  if v_distance_m > 500 then
    raise exception 'You need to be at the venue to check in (currently %m away)',
      round(v_distance_m::numeric, 0);
  end if;

  insert into public.check_ins (user_id, event_id, verified_by_qr)
  values (auth.uid(), p_event_id, true)
  on conflict (user_id, event_id) do nothing
  returning * into v_check_in;

  if v_check_in.id is null then
    raise exception 'You already checked in to this event';
  end if;

  perform public.evaluate_badges(auth.uid());

  return v_check_in;
end;
$$;

grant execute on function public.verify_check_in(uuid, text, double precision, double precision)
  to authenticated;

-- ------------------------------------------------------------------
-- complete_challenge: requires a prior check-in at the challenge's event.
-- ------------------------------------------------------------------
create or replace function public.complete_challenge(p_challenge_id uuid, p_data jsonb default '{}'::jsonb)
returns public.challenge_completions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_challenge public.challenges%rowtype;
  v_checked_in boolean;
  v_completion public.challenge_completions%rowtype;
begin
  select * into v_challenge from public.challenges where id = p_challenge_id;
  if not found then
    raise exception 'Challenge not found';
  end if;

  select exists (
    select 1 from public.check_ins
    where user_id = auth.uid() and event_id = v_challenge.event_id
  ) into v_checked_in;

  if not v_checked_in then
    raise exception 'Check in to this event before completing its challenges';
  end if;

  insert into public.challenge_completions (user_id, challenge_id, data)
  values (auth.uid(), p_challenge_id, p_data)
  on conflict (user_id, challenge_id) do nothing
  returning * into v_completion;

  if v_completion.id is null then
    raise exception 'You already completed this challenge';
  end if;

  perform public.evaluate_badges(auth.uid());

  return v_completion;
end;
$$;

grant execute on function public.complete_challenge(uuid, jsonb) to authenticated;

-- ------------------------------------------------------------------
-- redeem_reward: validates balance + expiry, then spends points.
-- ------------------------------------------------------------------
create or replace function public.redeem_reward(p_reward_id uuid)
returns public.user_rewards
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reward public.rewards%rowtype;
  v_balance integer;
  v_user_reward public.user_rewards%rowtype;
begin
  select * into v_reward from public.rewards where id = p_reward_id and active;
  if not found then
    raise exception 'Reward not found';
  end if;

  if v_reward.expires_at is not null and v_reward.expires_at < now() then
    raise exception 'This reward has expired';
  end if;

  select public.my_points_balance() into v_balance;
  if v_balance < v_reward.cost_points then
    raise exception 'Not enough points for this reward';
  end if;

  insert into public.user_rewards (user_id, reward_id)
  values (auth.uid(), p_reward_id)
  returning * into v_user_reward;

  insert into public.point_events (user_id, points, source, source_id)
  values (auth.uid(), -v_reward.cost_points, 'reward_redeemed', v_user_reward.id);

  return v_user_reward;
end;
$$;

grant execute on function public.redeem_reward(uuid) to authenticated;

-- ------------------------------------------------------------------
-- leaderboard(period): aggregated points per visible profile. Runs as
-- SECURITY DEFINER so it can sum every user's ledger while point_events
-- itself stays readable only by its own owner via RLS.
-- ------------------------------------------------------------------
create or replace function public.leaderboard(p_period text default 'all')
returns table (user_id uuid, name text, points bigint)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, coalesce(sum(pe.points), 0)::bigint as points
  from public.profiles p
  left join public.point_events pe
    on pe.user_id = p.id
   and (p_period <> 'weekly' or pe.created_at >= now() - interval '7 days')
  where p.leaderboard_visible
  group by p.id, p.name
  order by points desc, p.name asc;
$$;

grant execute on function public.leaderboard(text) to authenticated;

-- ------------------------------------------------------------------
-- create_order: the only path that inserts orders/order_items. Prices,
-- reward validation and totals are all computed here — the client sends
-- only item ids, quantities and where/when to pick up.
-- ------------------------------------------------------------------
create or replace function public.create_order(
  p_store_id uuid,
  p_event_id uuid,
  p_items jsonb,
  p_pickup_at timestamptz,
  p_user_reward_id uuid default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_menu_item public.menu_items%rowtype;
  v_quantity integer;
  v_subtotal integer := 0;
  v_discount integer := 0;
  v_order public.orders%rowtype;
  v_user_reward public.user_rewards%rowtype;
  v_reward public.rewards%rowtype;
  v_allowed_menu_ids uuid[];
begin
  if (p_store_id is null) = (p_event_id is null) then
    raise exception 'Order must have exactly one of store_id or event_id';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  if p_store_id is not null then
    select array_remove(array[menu_id], null) into v_allowed_menu_ids
      from public.stores where id = p_store_id;
  else
    select array_agg(menu_id) into v_allowed_menu_ids
      from public.event_menus where event_id = p_event_id;
  end if;

  if v_allowed_menu_ids is null or array_length(v_allowed_menu_ids, 1) is null then
    raise exception 'No menu is available for this location';
  end if;

  insert into public.orders (user_id, store_id, event_id, pickup_at)
  values (auth.uid(), p_store_id, p_event_id, p_pickup_at)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Invalid quantity';
    end if;

    select * into v_menu_item from public.menu_items
      where id = (v_item ->> 'menu_item_id')::uuid
        and available
        and menu_id = any (v_allowed_menu_ids);

    if not found then
      raise exception 'One of the items is not available at this location';
    end if;

    insert into public.order_items (
      order_id, menu_item_id, name_snapshot, unit_price_cents_snapshot, quantity, line_total_cents
    )
    values (
      v_order.id, v_menu_item.id, v_menu_item.name, v_menu_item.price_cents,
      v_quantity, v_menu_item.price_cents * v_quantity
    );

    v_subtotal := v_subtotal + v_menu_item.price_cents * v_quantity;
  end loop;

  if p_user_reward_id is not null then
    select * into v_user_reward from public.user_rewards
      where id = p_user_reward_id and user_id = auth.uid() and used_at is null;
    if not found then
      raise exception 'That reward is not available to use';
    end if;

    select * into v_reward from public.rewards where id = v_user_reward.reward_id;
    if v_reward.expires_at is not null and v_reward.expires_at < now() then
      raise exception 'This reward has expired';
    end if;

    v_discount := least(coalesce(v_reward.discount_cents, 0), v_subtotal);
    update public.user_rewards set used_at = now() where id = v_user_reward.id;
  end if;

  update public.orders
    set subtotal_cents = v_subtotal,
        discount_cents = v_discount,
        total_cents = greatest(v_subtotal - v_discount, 0),
        user_reward_id = v_user_reward.id
    where id = v_order.id
    returning * into v_order;

  return v_order;
end;
$$;

grant execute on function public.create_order(uuid, uuid, jsonb, timestamptz, uuid) to authenticated;

-- ------------------------------------------------------------------
-- confirm_mock_payment: stand-in for a real Stripe charge (Edge Function
-- later). Never let the client set status = 'paid' directly.
-- ------------------------------------------------------------------
create or replace function public.confirm_mock_payment(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  update public.orders
    set status = 'paid'
    where id = p_order_id and user_id = auth.uid() and status = 'draft'
    returning * into v_order;

  if not found then
    raise exception 'Order cannot be confirmed';
  end if;

  perform public.evaluate_badges(auth.uid());

  return v_order;
end;
$$;

grant execute on function public.confirm_mock_payment(uuid) to authenticated;

-- ------------------------------------------------------------------
-- advance_order_status: owner-only order management (New/Preparing/
-- Ready/Collected, or Cancel).
-- ------------------------------------------------------------------
create or replace function public.advance_order_status(p_order_id uuid, p_status text)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_owner() then
    raise exception 'Only an owner can update order status';
  end if;

  if p_status not in ('preparing', 'ready', 'collected', 'cancelled') then
    raise exception 'Invalid status';
  end if;

  update public.orders
    set status = p_status
    where id = p_order_id and status <> 'draft'
    returning * into v_order;

  if not found then
    raise exception 'Order not found';
  end if;

  return v_order;
end;
$$;

grant execute on function public.advance_order_status(uuid, text) to authenticated;
