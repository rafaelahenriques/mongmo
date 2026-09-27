-- Five more badges, for people who get around.
--
--   city-hopper         check in to pop-ups in 2 different cities
--   event-hopper        check in at 3 different pop-ups
--   shutterbug          complete 3 photo challenges (capture/discovery)
--   taste-tester        complete 2 tasting challenges (taste)
--   challenge-champion  complete 10 challenges in total
--
-- Idempotent: the rows are inserted with `on conflict do nothing`, and
-- `evaluate_badges` is replaced wholesale with the extended version.

insert into public.badges (key, title, description, points, sort_order) values
  ('city-hopper', 'City Hopper', 'Check in to pop-ups in 2 different cities', 50, 9),
  ('event-hopper', 'Event Hopper', 'Check in at 3 different pop-ups', 75, 10),
  ('shutterbug', 'Shutterbug', 'Complete 3 photo challenges', 50, 11),
  ('taste-tester', 'Taste Tester', 'Complete 2 tasting challenges', 50, 12),
  ('challenge-champion', 'Challenge Champion', 'Complete 10 challenges', 100, 13)
on conflict (key) do nothing;

-- Same function as 0002_functions.sql, extended with the five new
-- conditions. Every caller (check-in, challenge and order flows) picks
-- the new rules up automatically because they call it by name.
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
  v_cities integer;
  v_distinct_events integer;
  v_photo_completions integer;
  v_taste_completions integer;
begin
  select count(*) into v_check_ins from public.check_ins where user_id = p_user;
  select count(*) into v_completions from public.challenge_completions where user_id = p_user;
  select count(*) into v_paid_orders
    from public.orders where user_id = p_user and status not in ('draft', 'cancelled');
  select count(distinct event_id) into v_event_orders
    from public.orders
    where user_id = p_user and status not in ('draft', 'cancelled') and event_id is not null;
  select count(distinct e.city) into v_cities
    from public.check_ins c
    join public.events e on e.id = c.event_id
    where c.user_id = p_user;
  select count(distinct event_id) into v_distinct_events
    from public.check_ins where user_id = p_user;
  select count(*) into v_photo_completions
    from public.challenge_completions cc
    join public.challenges ch on ch.id = cc.challenge_id
    where cc.user_id = p_user and ch.type in ('capture', 'discovery');
  select count(*) into v_taste_completions
    from public.challenge_completions cc
    join public.challenges ch on ch.id = cc.challenge_id
    where cc.user_id = p_user and ch.type = 'taste';

  if v_check_ins >= 1 then perform public.award_badge(p_user, 'first-sip'); end if;
  if v_check_ins >= 2 then perform public.award_badge(p_user, 'popup-scout'); end if;
  if v_check_ins >= 4 then perform public.award_badge(p_user, 'street-food-fan'); end if;
  if v_check_ins >= 6 then perform public.award_badge(p_user, 'local-legend'); end if;
  if v_completions >= 3 then perform public.award_badge(p_user, 'memory-maker'); end if;
  if v_paid_orders >= 1 then perform public.award_badge(p_user, 'first-order'); end if;
  if v_paid_orders >= 3 then perform public.award_badge(p_user, 'regular'); end if;
  if v_event_orders >= 2 then perform public.award_badge(p_user, 'event-eater'); end if;
  if v_cities >= 2 then perform public.award_badge(p_user, 'city-hopper'); end if;
  if v_distinct_events >= 3 then perform public.award_badge(p_user, 'event-hopper'); end if;
  if v_photo_completions >= 3 then perform public.award_badge(p_user, 'shutterbug'); end if;
  if v_taste_completions >= 2 then perform public.award_badge(p_user, 'taste-tester'); end if;
  if v_completions >= 10 then perform public.award_badge(p_user, 'challenge-champion'); end if;
end;
$$;
