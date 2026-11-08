-- Pay at pickup: customers pay at the counter when they collect their
-- order; the app takes no payment.
--
-- The test payment (confirm_mock_payment) moved an order from draft to
-- 'paid' without any money changing hands, so 'paid' really meant "placed".
-- It's renamed 'placed', place_order() replaces the test payment, and each
-- order records how it's paid (`payment`, only 'at_pickup' for now) and
-- when (`paid_at`: set when staff mark it collected, which is when they
-- take the money).

alter table public.orders drop constraint if exists orders_status_check;
update public.orders set status = 'placed' where status = 'paid';
alter table public.orders add constraint orders_status_check
  check (status in ('draft', 'placed', 'preparing', 'ready', 'collected', 'cancelled'));

alter table public.orders
  add column if not exists payment text not null default 'at_pickup',
  add column if not exists paid_at timestamptz;
alter table public.orders drop constraint if exists orders_payment_check;
alter table public.orders add constraint orders_payment_check check (payment in ('at_pickup'));

-- The customer places their draft order; they pay when they collect it.
create or replace function public.place_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  update public.orders
     set status = 'placed'
   where id = p_order_id and user_id = auth.uid() and status = 'draft'
  returning * into v_order;
  if not found then
    raise exception 'That order can''t be placed';
  end if;

  perform public.evaluate_badges(auth.uid());
  return v_order;
end;
$$;

revoke execute on function public.place_order(uuid) from public, anon;
grant execute on function public.place_order(uuid) to authenticated;

drop function if exists public.confirm_mock_payment(uuid);

-- Staff move an order on; handing it over (collected) is when they take
-- the payment.
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
     set status = p_status,
         paid_at = case when p_status = 'collected' then coalesce(paid_at, now()) else paid_at end
   where id = p_order_id and status <> 'draft'
  returning * into v_order;

  if not found then
    raise exception 'Order not found';
  end if;

  return v_order;
end;
$$;

-- complete_challenge counts placed orders where it counted 'paid' ones.
CREATE OR REPLACE FUNCTION public.complete_challenge(p_challenge_id uuid, p_data jsonb DEFAULT '{}'::jsonb)
 RETURNS challenge_completions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user uuid := auth.uid();
  v_input jsonb := coalesce(p_data, '{}'::jsonb);
  v_challenge public.challenges%rowtype;
  v_event public.events%rowtype;
  v_data jsonb := '{}'::jsonb;
  v_count integer;
  v_required integer;
  v_distance_m double precision;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_rating numeric;
  v_seconds numeric;
  v_choice text;
  v_completion public.challenge_completions%rowtype;
begin
  if v_user is null then
    raise exception 'Sign in first';
  end if;

  select * into v_challenge from public.challenges where id = p_challenge_id;
  if not found then
    raise exception 'Challenge not found';
  end if;
  select * into v_event from public.events where id = v_challenge.event_id;

  if not exists (
    select 1 from public.check_ins where user_id = v_user and event_id = v_challenge.event_id
  ) then
    raise exception 'Check in to this event before completing its challenges';
  end if;

  if exists (
    select 1 from public.challenge_completions where user_id = v_user and challenge_id = p_challenge_id
  ) then
    raise exception 'You already completed this challenge';
  end if;

  case v_challenge.type
    when 'explore' then
      if jsonb_typeof(v_input -> 'latitude') is distinct from 'number'
         or jsonb_typeof(v_input -> 'longitude') is distinct from 'number' then
        raise exception 'Turn on location so we can confirm you''re at the venue';
      end if;
      v_distance_m := public.distance_m(
        v_event.latitude, v_event.longitude,
        (v_input ->> 'latitude')::double precision, (v_input ->> 'longitude')::double precision
      );
      v_required := (v_challenge.config ->> 'radiusM')::integer;
      if v_distance_m > v_required then
        raise exception 'You''re % m away — get within % m of the venue', round(v_distance_m), v_required;
      end if;
      v_data := jsonb_build_object('withinRadius', true);

    when 'capture', 'discovery' then
      v_required := (v_challenge.config ->> 'photoCount')::integer;
      select count(*)
        into v_count
        from public.photos p
        join storage.objects o on o.bucket_id = 'challenge-photos' and o.name = p.storage_path
        where p.user_id = v_user and p.challenge_id = p_challenge_id;
      if v_count < v_required then
        raise exception 'Take % photo% to complete this — % uploaded so far',
          v_required, case when v_required = 1 then '' else 's' end, v_count;
      end if;
      v_data := jsonb_build_object('photoCount', v_count);

    when 'taste' then
      if jsonb_typeof(v_input -> 'rating') is distinct from 'number' then
        raise exception 'Pick a rating from 1 to 5';
      end if;
      v_rating := (v_input ->> 'rating')::numeric;
      if v_rating not in (1, 2, 3, 4, 5) then
        raise exception 'Pick a rating from 1 to 5';
      end if;
      v_data := jsonb_build_object('rating', v_rating::integer);

    when 'timing' then
      v_starts_at := (v_challenge.config ->> 'startsAt')::timestamptz;
      v_ends_at := (v_challenge.config ->> 'endsAt')::timestamptz;
      if now() < v_starts_at then
        raise exception 'This one opens at %', to_char(v_starts_at at time zone v_event.time_zone, 'HH24:MI');
      end if;
      if now() > v_ends_at then
        raise exception 'This one closed at %', to_char(v_ends_at at time zone v_event.time_zone, 'HH24:MI');
      end if;

    when 'collection' then
      v_required := (v_challenge.config ->> 'dishCount')::integer;
      select count(distinct oi.menu_item_id) into v_count
        from public.orders o
        join public.order_items oi on oi.order_id = o.id
        where o.user_id = v_user
          and o.event_id = v_challenge.event_id
          and o.status in ('placed', 'preparing', 'ready', 'collected')
          and oi.menu_item_id is not null;
      if v_count < v_required then
        raise exception 'Order % different dishes here to complete this — you''ve tried % so far',
          v_required, v_count;
      end if;
      v_data := jsonb_build_object('dishCount', v_count);

    when 'streak' then
      v_required := (v_challenge.config ->> 'popupCount')::integer;
      select count(distinct event_id) into v_count from public.check_ins where user_id = v_user;
      if v_count < v_required then
        raise exception 'Check in at % pop-ups to complete this — you''re at %', v_required, v_count;
      end if;
      v_data := jsonb_build_object('popupCount', v_count);

    when 'motion' then
      -- Measured by the phone's motion sensors; the server can only check
      -- that the reported time is plausible and long enough.
      v_required := (v_challenge.config ->> 'seconds')::integer;
      if jsonb_typeof(v_input -> 'activeSeconds') is distinct from 'number' then
        raise exception 'Dance with your phone to fill the meter';
      end if;
      v_seconds := (v_input ->> 'activeSeconds')::numeric;
      if v_seconds > 3600 then
        raise exception 'That dance reading doesn''t look right — try again';
      end if;
      if v_seconds < v_required then
        raise exception 'Keep moving — % of % seconds', floor(v_seconds), v_required;
      end if;
      v_data := jsonb_build_object('activeSeconds', floor(v_seconds)::integer);

    when 'community' then
      v_choice := btrim(coalesce(v_input ->> 'choice', ''));
      if not (v_challenge.config -> 'options') ? v_choice then
        raise exception 'Pick one of the options to vote';
      end if;
      v_data := jsonb_build_object('choice', v_choice);

    else
      -- check_in (the check-in itself) and social (sharing can't be verified).
      v_data := '{}'::jsonb;
  end case;

  insert into public.challenge_completions (user_id, challenge_id, data)
  values (v_user, p_challenge_id, v_data)
  on conflict (user_id, challenge_id) do nothing
  returning * into v_completion;

  if v_completion.id is null then
    raise exception 'You already completed this challenge';
  end if;

  perform public.evaluate_badges(v_user);

  return v_completion;
end;
$function$;
