-- Per-type challenge settings, validated when an owner saves a challenge and
-- enforced when a customer completes it.
--
--   explore     { radiusM }            be within radiusM of the venue (100–2000)
--   check_in    {}                     the QR check-in is the whole challenge
--   capture     { photoCount, prompt } upload photoCount photos (1–5)
--   discovery   { photoCount, hint }   find something, photograph it (1–3)
--   taste       { dish }               rate it 1–5 (dish is optional)
--   social      { message }            share (message is optional)
--   timing      { startsAt, endsAt }   complete inside this window
--   collection  { dishCount }          order dishCount different dishes here (2–10)
--   streak      { popupCount }         have checked in at popupCount pop-ups (2–20)
--   community   { options }            vote for one of 2–6 options
--
-- The app mirrors these limits in src/utils/challengeConfig.ts. Idempotent.

alter table public.challenges add column if not exists config jsonb not null default '{}'::jsonb;

alter table public.challenges drop constraint if exists challenges_title_length;
alter table public.challenges add constraint challenges_title_length
  check (char_length(btrim(title)) between 1 and 80);
alter table public.challenges drop constraint if exists challenges_description_length;
alter table public.challenges add constraint challenges_description_length
  check (char_length(description) <= 280);

-- ------------------------------------------------------------------
-- Reading one setting out of a config object.
-- ------------------------------------------------------------------
create or replace function public.challenge_config_int(
  p_config jsonb, p_key text, p_default integer, p_min integer, p_max integer, p_label text
)
returns integer
language plpgsql
immutable
as $$
declare
  v_value jsonb := p_config -> p_key;
begin
  if v_value is null or v_value = 'null'::jsonb then
    return p_default;
  end if;
  if jsonb_typeof(v_value) <> 'number' or (v_value #>> '{}')::numeric % 1 <> 0 then
    raise exception '% must be a whole number', p_label;
  end if;
  if (v_value #>> '{}')::numeric not between p_min and p_max then
    raise exception '% must be between % and %', p_label, p_min, p_max;
  end if;
  return (v_value #>> '{}')::integer;
end;
$$;

create or replace function public.challenge_config_text(
  p_config jsonb, p_key text, p_max_length integer, p_label text
)
returns text
language plpgsql
immutable
as $$
declare
  v_value jsonb := p_config -> p_key;
  v_text text;
begin
  if v_value is null or v_value = 'null'::jsonb then
    return '';
  end if;
  if jsonb_typeof(v_value) <> 'string' then
    raise exception '% must be text', p_label;
  end if;
  v_text := btrim(v_value #>> '{}');
  if char_length(v_text) > p_max_length then
    raise exception '% can be at most % characters', p_label, p_max_length;
  end if;
  return v_text;
end;
$$;

-- ------------------------------------------------------------------
-- The whole config for a type: unknown keys dropped, defaults filled in,
-- anything out of range rejected. Timing defaults to the pop-up's first
-- hour.
-- ------------------------------------------------------------------
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

create or replace function public.challenges_normalize_config()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  -- Only the columns it needs: `events.*` includes qr_token, which the
  -- signed-in owner running this trigger may not select (0006).
  v_starts_at timestamptz;
  v_ends_at timestamptz;
begin
  select starts_at, ends_at into v_starts_at, v_ends_at from public.events where id = new.event_id;
  new.title := btrim(new.title);
  new.description := btrim(new.description);
  if new.title = '' then
    raise exception 'Give the challenge a title';
  end if;
  if char_length(new.title) > 80 then
    raise exception 'The title can be at most 80 characters';
  end if;
  if char_length(new.description) > 280 then
    raise exception 'The description can be at most 280 characters';
  end if;
  new.config := public.normalize_challenge_config(new.type, new.config, v_starts_at, v_ends_at);
  return new;
end;
$$;

-- Bring existing rows in line before the trigger starts guarding writes.
-- (A community vote had no options until now; give old ones a yes/no.)
update public.challenges
  set config = jsonb_build_object('options', jsonb_build_array('Yes', 'No'))
  where type = 'community' and jsonb_typeof(config -> 'options') is distinct from 'array';
update public.challenges c
  set config = public.normalize_challenge_config(c.type, c.config, e.starts_at, e.ends_at)
  from public.events e
  where e.id = c.event_id;

drop trigger if exists challenges_normalize_config on public.challenges;
create trigger challenges_normalize_config
  before insert or update of type, title, description, config on public.challenges
  for each row execute function public.challenges_normalize_config();

-- ------------------------------------------------------------------
-- Great-circle distance in meters (same haversine as verify_check_in).
-- ------------------------------------------------------------------
create or replace function public.distance_m(
  p_lat1 double precision, p_lng1 double precision, p_lat2 double precision, p_lng2 double precision
)
returns double precision
language sql
immutable
as $$
  select 2 * 6371000 * asin(sqrt(
    sin(radians(p_lat2 - p_lat1) / 2) ^ 2 +
    cos(radians(p_lat1)) * cos(radians(p_lat2)) * sin(radians(p_lng2 - p_lng1) / 2) ^ 2
  ));
$$;

-- ------------------------------------------------------------------
-- A photo row must point into the uploader's own storage folder.
-- ------------------------------------------------------------------
drop policy if exists "photos insert own" on public.photos;
create policy "photos insert own" on public.photos
  for insert to authenticated
  with check (auth.uid() = user_id and storage_path like auth.uid()::text || '/%');

-- ------------------------------------------------------------------
-- complete_challenge: a prior check-in, then the type's own rule. What
-- gets stored is only what the rule checked, never the raw payload.
-- ------------------------------------------------------------------
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
