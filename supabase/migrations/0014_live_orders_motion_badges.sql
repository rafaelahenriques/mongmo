-- Round of additions, all enforced here rather than trusted to the app:
--
-- 1. Security: award_badge and evaluate_badges are SECURITY DEFINER helpers
--    that were executable by any signed-in user — so anyone could grant
--    themselves any badge (and its points) through the API. Only the
--    database's own functions and triggers may call them now.
-- 2. Ordering at a pop-up only while it runs (the app hides the button,
--    this makes it true).
-- 3. A `motion` challenge type ("dance meter", for DJ nights) with a
--    `seconds` setting (10–60).
-- 4. Every pop-up an owner creates starts with a photo challenge.
-- 5. Eight more badges, and badge_progress() as the one place each
--    badge's rule lives: evaluate_badges awards from it, and the app shows
--    "3 of 5" progress from my_badge_progress().
--
-- Idempotent.

-- ------------------------------------------------------------------
-- 1. Internal helpers are not part of the API.
-- ------------------------------------------------------------------
revoke execute on function public.award_badge(uuid, text) from public, anon, authenticated;
revoke execute on function public.evaluate_badges(uuid) from public, anon, authenticated;

-- ------------------------------------------------------------------
-- 2. Pop-up orders only while the pop-up is on.
-- ------------------------------------------------------------------
create or replace function public.orders_require_running_event()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_status text;
  v_time_zone text;
begin
  if new.event_id is null then
    return new;
  end if;
  select starts_at, ends_at, status, time_zone
    into v_starts_at, v_ends_at, v_status, v_time_zone
    from public.events where id = new.event_id;
  if v_status = 'cancelled' then
    raise exception 'This pop-up was cancelled';
  end if;
  if now() < v_starts_at then
    raise exception 'Ordering opens when the pop-up starts (%)',
      to_char(v_starts_at at time zone v_time_zone, 'Dy DD Mon, HH24:MI');
  end if;
  if now() > v_ends_at then
    raise exception 'This pop-up has ended';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_require_running_event on public.orders;
create trigger orders_require_running_event
  before insert on public.orders
  for each row execute function public.orders_require_running_event();

-- ------------------------------------------------------------------
-- 3. The motion challenge type.
-- ------------------------------------------------------------------
alter table public.challenges drop constraint if exists challenges_type_check;
alter table public.challenges add constraint challenges_type_check check (
  type in (
    'explore', 'check_in', 'capture', 'taste', 'social',
    'timing', 'collection', 'discovery', 'streak', 'community', 'motion'
  )
);

-- The whole settings normalizer again, with the motion case added.
create or replace function public.normalize_challenge_config(
  p_type text, p_config jsonb, p_event_starts_at timestamptz, p_event_ends_at timestamptz
)
returns jsonb
language plpgsql
stable
as $$
declare
  v_config jsonb := coalesce(p_config, '{}'::jsonb);
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_options jsonb := '[]'::jsonb;
  v_option jsonb;
  v_text text;
begin
  if jsonb_typeof(v_config) <> 'object' then
    raise exception 'Challenge settings must be an object';
  end if;

  case p_type
    when 'explore' then
      return jsonb_build_object(
        'radiusM', public.challenge_config_int(v_config, 'radiusM', 500, 100, 2000, 'Distance')
      );
    when 'capture' then
      return jsonb_build_object(
        'photoCount', public.challenge_config_int(v_config, 'photoCount', 1, 1, 5, 'Number of photos'),
        'prompt', public.challenge_config_text(v_config, 'prompt', 120, 'What to photograph')
      );
    when 'discovery' then
      return jsonb_build_object(
        'photoCount', public.challenge_config_int(v_config, 'photoCount', 1, 1, 3, 'Number of photos'),
        'hint', public.challenge_config_text(v_config, 'hint', 160, 'Hint')
      );
    when 'taste' then
      return jsonb_build_object('dish', public.challenge_config_text(v_config, 'dish', 60, 'Dish'));
    when 'social' then
      return jsonb_build_object('message', public.challenge_config_text(v_config, 'message', 200, 'Share message'));
    when 'timing' then
      begin
        v_starts_at := coalesce((v_config ->> 'startsAt')::timestamptz, p_event_starts_at);
        v_ends_at := coalesce(
          (v_config ->> 'endsAt')::timestamptz,
          least(v_starts_at + interval '1 hour', p_event_ends_at)
        );
      exception when others then
        raise exception 'The time window must be two valid times';
      end;
      if v_ends_at <= v_starts_at then
        raise exception 'The time window has to end after it starts';
      end if;
      return jsonb_build_object('startsAt', v_starts_at, 'endsAt', v_ends_at);
    when 'collection' then
      return jsonb_build_object(
        'dishCount', public.challenge_config_int(v_config, 'dishCount', 3, 2, 10, 'Number of dishes')
      );
    when 'motion' then
      return jsonb_build_object(
        'seconds', public.challenge_config_int(v_config, 'seconds', 20, 10, 60, 'Dance time')
      );
    when 'streak' then
      return jsonb_build_object(
        'popupCount', public.challenge_config_int(v_config, 'popupCount', 3, 2, 20, 'Number of pop-ups')
      );
    when 'community' then
      if jsonb_typeof(v_config -> 'options') is distinct from 'array' then
        raise exception 'Add at least two options to vote on';
      end if;
      for v_option in select * from jsonb_array_elements(v_config -> 'options') loop
        if jsonb_typeof(v_option) <> 'string' then
          raise exception 'Vote options must be text';
        end if;
        v_text := btrim(v_option #>> '{}');
        if v_text = '' then
          continue;
        end if;
        if char_length(v_text) > 40 then
          raise exception 'Vote options can be at most 40 characters';
        end if;
        if not exists (
          select 1 from jsonb_array_elements_text(v_options) as existing (option)
          where lower(existing.option) = lower(v_text)
        ) then
          v_options := v_options || to_jsonb(v_text);
        end if;
      end loop;
      if jsonb_array_length(v_options) not between 2 and 6 then
        raise exception 'A vote needs between 2 and 6 different options';
      end if;
      return jsonb_build_object('options', v_options);
    else
      return '{}'::jsonb;
  end case;
end;
$$;

-- The whole completion rule again, with the motion case added.
create or replace function public.complete_challenge(p_challenge_id uuid, p_data jsonb default '{}'::jsonb)
returns public.challenge_completions
language plpgsql
security definer
set search_path = public
as $$
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
      v_data := jsonb_build_object('distanceM', round(v_distance_m));

    when 'capture', 'discovery' then
      v_required := (v_challenge.config ->> 'photoCount')::integer;
      select count(*), coalesce(jsonb_agg(p.url order by p.created_at), '[]'::jsonb)
        into v_count, v_data
        from public.photos p
        join storage.objects o on o.bucket_id = 'challenge-photos' and o.name = p.storage_path
        where p.user_id = v_user and p.challenge_id = p_challenge_id;
      if v_count < v_required then
        raise exception 'Take % photo% to complete this — % uploaded so far',
          v_required, case when v_required = 1 then '' else 's' end, v_count;
      end if;
      v_data := jsonb_build_object('photoUrls', v_data);

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
          and o.status in ('paid', 'preparing', 'ready', 'collected')
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
$$;

grant execute on function public.complete_challenge(uuid, jsonb) to authenticated;

-- ------------------------------------------------------------------
-- 4. A photo challenge on every pop-up an owner creates (the seed's own
--    pop-ups, created_by null, bring their own).
-- ------------------------------------------------------------------
create or replace function public.events_add_photo_challenge()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.challenges (event_id, type, title, description, points, sort_order, config)
    values (
      new.id, 'capture', 'Snap the pop-up', 'Show us your favourite moment here.', 15, 0,
      jsonb_build_object('photoCount', 1, 'prompt', 'your favourite moment')
    );
  end if;
  return null;
end;
$$;

drop trigger if exists events_add_photo_challenge on public.events;
create trigger events_add_photo_challenge
  after insert on public.events
  for each row execute function public.events_add_photo_challenge();

-- Pop-ups that haven't ended and have no photo challenge yet get one too.
insert into public.challenges (event_id, type, title, description, points, sort_order, config)
select e.id, 'capture', 'Snap the pop-up', 'Show us your favourite moment here.', 15, 0,
       jsonb_build_object('photoCount', 1, 'prompt', 'your favourite moment')
  from public.events e
  where e.status <> 'cancelled'
    and e.ends_at > now()
    and not exists (
      select 1 from public.challenges c
      where c.event_id = e.id and c.type in ('capture', 'discovery')
    );

-- ------------------------------------------------------------------
-- 5. More badges, and one definition of every badge's rule.
-- ------------------------------------------------------------------
insert into public.badges (key, title, description, points, sort_order) values
  ('night-owl', 'Night Owl', 'Check in at a pop-up after 21:00', 30, 9),
  ('city-hopper', 'City Hopper', 'Check in at pop-ups in 2 cities', 60, 10),
  ('shutterbug', 'Shutterbug', 'Take 5 challenge photos', 50, 11),
  ('food-critic', 'Food Critic', 'Rate 3 dishes', 40, 12),
  ('dance-machine', 'Dance Machine', 'Fill a dance meter', 40, 13),
  ('crowd-voice', 'Voice of the Crowd', 'Vote in 2 polls', 30, 14),
  ('early-bird', 'Early Bird', 'Beat the clock on a timing challenge', 30, 15),
  ('challenge-champion', 'Challenge Champion', 'Complete 10 challenges', 100, 16)
on conflict (key) do nothing;

-- Where the user stands on every badge: `current` towards `target`.
create or replace function public.badge_progress(p_user uuid)
returns table (key text, current integer, target integer)
language sql
stable
security definer
set search_path = public
as $$
  with checked_in as (
    select e.city, e.time_zone, ci.checked_in_at
    from public.check_ins ci
    join public.events e on e.id = ci.event_id
    where ci.user_id = p_user
  ),
  completed as (
    select c.type
    from public.challenge_completions cc
    join public.challenges c on c.id = cc.challenge_id
    where cc.user_id = p_user
  ),
  paid as (
    select event_id
    from public.orders
    where user_id = p_user and status not in ('draft', 'cancelled')
  ),
  stats as (
    select
      (select count(*) from checked_in)::integer as check_ins,
      (select count(distinct city) from checked_in)::integer as cities,
      (select count(*) from checked_in
        where extract(hour from checked_in_at at time zone time_zone) >= 21
           or extract(hour from checked_in_at at time zone time_zone) < 4)::integer as late_check_ins,
      (select count(*) from completed)::integer as completions,
      (select count(*) from completed where type = 'taste')::integer as tastes,
      (select count(*) from completed where type = 'motion')::integer as dances,
      (select count(*) from completed where type = 'community')::integer as votes,
      (select count(*) from completed where type = 'timing')::integer as timed,
      (select count(*) from paid)::integer as orders,
      (select count(distinct event_id) from paid where event_id is not null)::integer as event_orders,
      (select count(*)
        from public.photos p
        join storage.objects o on o.bucket_id = 'challenge-photos' and o.name = p.storage_path
        where p.user_id = p_user)::integer as photos
  )
  select rule.key, least(rule.current, rule.target), rule.target
  from stats,
  lateral (values
    ('first-sip', check_ins, 1),
    ('popup-scout', check_ins, 2),
    ('street-food-fan', check_ins, 4),
    ('local-legend', check_ins, 6),
    ('memory-maker', completions, 3),
    ('first-order', orders, 1),
    ('regular', orders, 3),
    ('event-eater', event_orders, 2),
    ('night-owl', late_check_ins, 1),
    ('city-hopper', cities, 2),
    ('shutterbug', photos, 5),
    ('food-critic', tastes, 3),
    ('dance-machine', dances, 1),
    ('crowd-voice', votes, 2),
    ('early-bird', timed, 1),
    ('challenge-champion', completions, 10)
  ) as rule (key, current, target);
$$;

revoke execute on function public.badge_progress(uuid) from public, anon, authenticated;

-- The signed-in user's own progress, for the app.
create or replace function public.my_badge_progress()
returns table (key text, current integer, target integer)
language sql
stable
security definer
set search_path = public
as $$
  select * from public.badge_progress(auth.uid());
$$;

grant execute on function public.my_badge_progress() to authenticated;

create or replace function public.evaluate_badges(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_badges (user_id, badge_id)
  select p_user, b.id
  from public.badge_progress(p_user) progress
  join public.badges b on b.key = progress.key
  where progress.current >= progress.target
  on conflict (user_id, badge_id) do nothing;
end;
$$;

revoke execute on function public.evaluate_badges(uuid) from public, anon, authenticated;

-- Anyone who already qualifies for a new badge gets it now.
do $$
begin
  perform public.evaluate_badges(id) from public.profiles;
end;
$$;
