-- From testing the first TestFlight build:
--   1. An order that was placed and then cancelled still earned its
--      badges ("First Order", 25 points). Order badges now count orders
--      that were collected, like the order's own points always have.
--   2. The leaderboard listed everyone who is on it, people with no
--      points included. It lists people with points.
--   3. The café showed "11 inside": a made-up number from the starting
--      data. Nothing counts people at the café (pop-ups count check-ins),
--      so it's 0 and the app no longer shows it.
--   4. A note with an order ("no coriander"), written at checkout.

-- 1. Order badges: collected orders only. -----------------------------------
-- As 0015, with one change: `paid` is collected orders, not every order
-- that isn't a draft or cancelled.
create or replace function public.badge_progress(p_user uuid)
returns table (key text, current integer, target integer)
language sql
stable
security definer
set search_path = public
as $$
  with checked_in as (
    select ci.event_id, e.city, e.time_zone, ci.checked_in_at
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
    where user_id = p_user and status = 'collected'
  ),
  stats as (
    select
      (select count(*) from checked_in)::integer as check_ins,
      (select count(distinct city) from checked_in)::integer as cities,
      (select count(distinct event_id) from checked_in)::integer as events,
      (select count(*) from checked_in
        where extract(hour from checked_in_at at time zone time_zone) >= 21
           or extract(hour from checked_in_at at time zone time_zone) < 4)::integer as late_check_ins,
      (select count(*) from completed)::integer as completions,
      (select count(*) from completed where type in ('capture', 'discovery'))::integer as photo_challenges,
      (select count(*) from completed where type = 'taste')::integer as tastes,
      (select count(*) from completed where type = 'motion')::integer as dances,
      (select count(*) from completed where type = 'community')::integer as votes,
      (select count(*) from completed where type = 'timing')::integer as timed,
      (select count(*) from paid)::integer as orders,
      (select count(distinct event_id) from paid where event_id is not null)::integer as event_orders
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
    ('city-hopper', cities, 2),
    ('event-hopper', events, 3),
    ('shutterbug', photo_challenges, 3),
    ('taste-tester', tastes, 2),
    ('challenge-champion', completions, 10),
    ('night-owl', late_check_ins, 1),
    ('dance-machine', dances, 1),
    ('crowd-voice', votes, 2),
    ('early-bird', timed, 1)
  ) as rule (key, current, target);
$$;
revoke execute on function public.badge_progress(uuid) from public, anon, authenticated;

-- Collecting an order is now what can earn an order badge, so badges are
-- looked at then (placing one still looks, and finds nothing new). The
-- points are as 0021.
create or replace function public.award_order_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base integer;
  v_points integer;
  v_bonus integer;
begin
  if new.status = 'collected' and old.status is distinct from 'collected' then
    if new.total_cents > 0 then
      -- 10 points per euro: one per 10 cents, rounded down.
      v_base := new.total_cents / 10;
      if not exists (select 1 from public.point_events where user_id = new.user_id and source = 'order') then
        v_points := v_base * 2;
      else
        select order_bonus_pct into v_bonus from public.level_for(public.lifetime_points(new.user_id));
        v_points := v_base + (v_base * coalesce(v_bonus, 0)) / 100;
      end if;
      insert into public.point_events (user_id, points, source, source_id)
      values (new.user_id, v_points, 'order', new.id)
      on conflict do nothing;
    end if;
    perform public.evaluate_badges(new.user_id);
  end if;
  return new;
end;
$$;
revoke execute on function public.award_order_points() from public, anon, authenticated;

update public.badges set description = 'Pick up your first order' where key = 'first-order';
update public.badges set description = 'Pick up 3 orders' where key = 'regular';
update public.badges set description = 'Pick up orders at 2 different pop-ups' where key = 'event-eater';

-- 2. The leaderboard: people with points. -----------------------------------
-- As 0034, plus the `having`.
create or replace function public.leaderboard(p_period text default 'all')
returns table (user_id uuid, name text, points bigint, avatar_path text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, coalesce(sum(pe.points), 0)::bigint as points,
         case when p.avatar_hidden_at is null then p.avatar_path end
  from public.profiles p
  left join public.point_events pe on pe.user_id = p.id
   and (p_period <> 'weekly' or pe.created_at >= now() - interval '7 days')
  where p.leaderboard_visible
  group by p.id, p.name, p.avatar_path, p.avatar_hidden_at
  having coalesce(sum(pe.points), 0) > 0
  order by points desc, p.name asc;
$$;
revoke execute on function public.leaderboard(text) from public, anon;
grant execute on function public.leaderboard(text) to authenticated;

-- 3. Nobody counts people at the café. --------------------------------------
update public.stores set occupancy = 0 where occupancy <> 0;

-- 4. A note with an order. --------------------------------------------------
-- Free text from the customer, read by staff with the order. One line, at
-- most 200 characters. It goes when the order goes (account deletion, and
-- after 24 months).
alter table public.orders add column if not exists note text;
alter table public.orders drop constraint if exists orders_note_check;
alter table public.orders add constraint orders_note_check
  check (note is null or char_length(note) between 1 and 200);

comment on column public.orders.note is
  'What the customer wrote for the kitchen at checkout; null when nothing.';

-- Sets (or clears) the note on the caller's own order while it's still a
-- draft, so it can't change under the kitchen once the order is placed.
create or replace function public.set_order_note(p_order_id uuid, p_note text)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  -- One line: runs of spaces and line breaks become a single space.
  v_note text := nullif(btrim(regexp_replace(coalesce(p_note, ''), '\s+', ' ', 'g')), '');
  v_order public.orders%rowtype;
begin
  if char_length(v_note) > 200 then
    raise exception 'Keep the note to 200 characters' using errcode = '22023';
  end if;
  update public.orders
     set note = v_note
   where id = p_order_id and user_id = auth.uid() and status = 'draft'
  returning * into v_order;
  if not found then
    raise exception 'A note can only be added before the order is placed' using errcode = 'P0002';
  end if;
  return v_order;
end;
$$;
revoke execute on function public.set_order_note(uuid, text) from public, anon;
grant execute on function public.set_order_note(uuid, text) to authenticated;

-- 5. The menu's options. ----------------------------------------------------
-- No more "Additional protein". Coriander and spicy on bánh mì and
-- springrolls (free); springrolls come with peanut or mango sauce, and
-- more of either is €0.90; a salmon springroll. The same rows as
-- supabase/base.sql, for projects that already have the starting menu
-- (a new project gets them from base.sql, which runs after this).
do $$
declare
  v_menu constant uuid := '00000000-0000-0000-0000-0000000000d1';
begin
  if not exists (select 1 from public.menus where id = v_menu) then
    return;
  end if;

  delete from public.menu_items where id = '00000000-0000-0000-0000-0000000000da';

  insert into public.menu_items (id, menu_id, name, description, price_cents, category, sort_order, available, add_on_for) values
    ('00000000-0000-0000-0000-0000000000e4', v_menu, 'Springrolls, salmon', null, 500, 'Springrolls', 9, true, null),
    ('00000000-0000-0000-0000-0000000000dc', v_menu, 'Peanut sauce', null, 0, 'Choose your sauce', 10, true, '{Springrolls}'),
    ('00000000-0000-0000-0000-0000000000db', v_menu, 'Mango sauce', null, 0, 'Choose your sauce', 11, true, '{Springrolls}'),
    ('00000000-0000-0000-0000-0000000000e0', v_menu, 'Coriander', null, 0, 'Options', 12, true, '{Bánh mì,Springrolls}'),
    ('00000000-0000-0000-0000-0000000000e1', v_menu, 'Spicy', null, 0, 'Options', 13, true, '{Bánh mì,Springrolls}'),
    ('00000000-0000-0000-0000-0000000000e2', v_menu, 'Extra peanut sauce', null, 90, 'Extras', 14, true, '{Springrolls}'),
    ('00000000-0000-0000-0000-0000000000e3', v_menu, 'Extra mango sauce', null, 90, 'Extras', 15, true, '{Springrolls}')
  on conflict (id) do update set
    name = excluded.name,
    price_cents = excluded.price_cents,
    category = excluded.category,
    sort_order = excluded.sort_order,
    add_on_for = excluded.add_on_for;

  update public.menu_items set sort_order = 16 where id = '00000000-0000-0000-0000-0000000000dd';
  update public.menu_items set sort_order = 17 where id = '00000000-0000-0000-0000-0000000000de';
  update public.menu_items set sort_order = 18 where id = '00000000-0000-0000-0000-0000000000df';
end;
$$;
