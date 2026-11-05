-- Points that pay for themselves.
--
-- Until now points only came from challenges and badges, which cost the
-- customer nothing: one evening at a pop-up with every challenge done was
-- a free bánh mì. Now:
--
--   * Orders earn 10 points per euro paid, once the order is collected
--     (picked up and paid at the counter), so cancelled orders earn nothing.
--   * Challenges still earn their points, up to 50 a day per pop-up
--     (half a stamp). They bring people to the truck; buying is what fills
--     the card.
--   * Badges are smaller one-off bonuses.
--   * A stamp is 100 points, and every reward costs whole stamps, so a
--     reward never leaves a fraction behind: what's left over is progress
--     toward the next stamp.
--
-- What it costs the café: a free bánh mì (10 stamps) comes after about
-- €100 spent. To the customer that's 10% back; to the café it's the food
-- cost of one bánh mì, about 3% of that €100.

-- ------------------------------------------------------------------
-- Orders earn points when collected.
-- ------------------------------------------------------------------
alter table public.point_events drop constraint if exists point_events_source_check;
alter table public.point_events add constraint point_events_source_check
  check (source in ('challenge_completion', 'badge', 'reward_redeemed', 'order'));

-- One award per order, even if its status goes back and forth.
create unique index if not exists point_events_one_per_order
  on public.point_events (source_id) where source = 'order';

create or replace function public.award_order_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'collected' and old.status is distinct from 'collected' and new.total_cents > 0 then
    -- 10 points per euro: one per 10 cents, rounded down.
    insert into public.point_events (user_id, points, source, source_id)
    values (new.user_id, new.total_cents / 10, 'order', new.id)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_award_points on public.orders;
create trigger orders_award_points
  after update of status on public.orders
  for each row execute function public.award_order_points();

-- ------------------------------------------------------------------
-- Challenges: at most 50 points a day per pop-up.
-- ------------------------------------------------------------------
create or replace function public.award_challenge_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points integer;
  v_event uuid;
  v_today date := (now() at time zone 'Europe/Brussels')::date;
  v_so_far integer;
begin
  select points, event_id into v_points, v_event from public.challenges where id = new.challenge_id;

  select coalesce(sum(pe.points), 0) into v_so_far
  from public.point_events pe
  join public.challenge_completions cc on cc.id = pe.source_id
  join public.challenges c on c.id = cc.challenge_id
  where pe.user_id = new.user_id
    and pe.source = 'challenge_completion'
    and c.event_id = v_event
    and (pe.created_at at time zone 'Europe/Brussels')::date = v_today;

  insert into public.point_events (user_id, points, source, source_id)
  values (new.user_id, greatest(0, least(coalesce(v_points, 0), 50 - v_so_far)), 'challenge_completion', new.id);
  return new;
end;
$$;

-- ------------------------------------------------------------------
-- Badges: smaller one-off bonuses (they were 930 points in all, now 495).
-- ------------------------------------------------------------------
update public.badges b set points = v.points
from (values
  ('first-sip', 10), ('popup-scout', 25), ('street-food-fan', 40), ('local-legend', 50),
  ('memory-maker', 40), ('first-order', 25), ('regular', 50), ('event-eater', 25),
  ('city-hopper', 25), ('event-hopper', 40), ('shutterbug', 25), ('taste-tester', 25),
  ('challenge-champion', 50), ('night-owl', 15), ('dance-machine', 20), ('crowd-voice', 15),
  ('early-bird', 15)
) as v(key, points)
where b.key = v.key;

-- ------------------------------------------------------------------
-- Rewards in whole stamps (100 points each). Only touches the seeded ones.
-- ------------------------------------------------------------------
update public.rewards r set title = v.title, description = v.description, cost_points = v.cost, discount_cents = v.discount
from (values
  ('00000000-0000-0000-0000-0000000000a1'::uuid, 'Mongmo sticker pack', 'Limited pop-up artwork, 4 pieces', 200, null::integer),
  ('00000000-0000-0000-0000-0000000000a2'::uuid, '€2 off your order', 'Comes off at checkout', 400, 200),
  ('00000000-0000-0000-0000-0000000000a3'::uuid, 'Free springrolls', 'Any filling, with your dip', 500, null),
  ('00000000-0000-0000-0000-0000000000a4'::uuid, 'Free bánh mì', 'Any filling, your pick', 1000, null)
) as v(id, title, description, cost, discount)
where r.id = v.id;
