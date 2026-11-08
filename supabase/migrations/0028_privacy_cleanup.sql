-- Less personal data, from the data inventory's proposals
-- (docs/privacy/data-inventory.md, items 4, 5, 6 and 8).
--
-- 4. A check-in challenge recorded how far from the venue the person was:
--    location data, when only pass or fail matters. It now records
--    {"withinRadius": true}, and the distances already stored are cleared.
-- 5. Photo challenges completed before 0024 still held links to the photos
--    in their results; those become a photo count, like new ones.
-- 6. The leaderboard is opt-in: new accounts start hidden. Existing
--    accounts keep the choice they have.
-- 8. The demo pop-ups' pictures came from images.unsplash.com, which tells
--    Unsplash every viewer's IP address. They're cleared; the app shows
--    Mongmo's own bundled photos for a pop-up without a picture.

-- 4. ----------------------------------------------------------------------
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
$function$;

update public.challenge_completions
   set data = (data - 'distanceM') || '{"withinRadius": true}'::jsonb
 where data ? 'distanceM';

-- 5. ----------------------------------------------------------------------
update public.challenge_completions
   set data = (data - 'photoUrls') || jsonb_build_object('photoCount', jsonb_array_length(data -> 'photoUrls'))
 where jsonb_typeof(data -> 'photoUrls') = 'array';

-- 6. ----------------------------------------------------------------------
alter table public.profiles alter column leaderboard_visible set default false;

-- 8. ----------------------------------------------------------------------
update public.events set image_url = null where image_url like 'https://images.unsplash.com/%';
update public.menu_items set image_url = null where image_url like 'https://images.unsplash.com/%';
