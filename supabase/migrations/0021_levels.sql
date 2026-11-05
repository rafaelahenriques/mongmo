-- Levels: Dough, Rising, Golden, Crisp, the bánh mì's own bake.
--
-- Your level comes from your lifetime points: every point you've ever
-- earned (orders, challenges, badges). Redeeming a reward spends points
-- from your balance but never lowers your lifetime total, so you never
-- drop a level.
--
--   Dough   from the start     points on every order and challenge
--   Rising  500 points (~€50)  +10% points on orders, a Mongmo tote bag
--   Golden  1,500 (~€150)      +25% points on orders, a free stew
--   Crisp   4,000 (~€400)      +50% points on orders, 2 free bánh mì to share
--
-- And a welcome deal: your first collected order earns double points.

-- ------------------------------------------------------------------
-- The levels, readable by everyone (the app shows the ladder).
-- ------------------------------------------------------------------
create table if not exists public.levels (
  key text primary key,
  name text not null,
  min_points integer not null unique check (min_points >= 0),
  order_bonus_pct integer not null default 0 check (order_bonus_pct between 0 and 100),
  perk text not null default ''
);

alter table public.levels enable row level security;
drop policy if exists "levels are readable by everyone" on public.levels;
create policy "levels are readable by everyone" on public.levels for select using (true);
grant select on public.levels to anon, authenticated;

insert into public.levels (key, name, min_points, order_bonus_pct, perk) values
  ('dough', 'Dough', 0, 0, 'Points on every order and challenge'),
  ('rising', 'Rising', 500, 10, '+10% points on orders, and a Mongmo tote bag to claim'),
  ('golden', 'Golden', 1500, 25, '+25% points on orders, and a free Vietnamese stew to claim'),
  ('crisp', 'Crisp', 4000, 50, '+50% points on orders, and 2 free bánh mì to share')
on conflict (key) do update set
  name = excluded.name,
  min_points = excluded.min_points,
  order_bonus_pct = excluded.order_bonus_pct,
  perk = excluded.perk;

-- ------------------------------------------------------------------
-- Lifetime points and the level they reach. Internal helpers: the app
-- reads its own through my_loyalty() below.
-- ------------------------------------------------------------------
create or replace function public.lifetime_points(p_user uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(points), 0)::integer
  from public.point_events
  where user_id = p_user and points > 0;
$$;

create or replace function public.level_for(p_points integer)
returns public.levels
language sql
stable
set search_path = public
as $$
  select * from public.levels where min_points <= p_points order by min_points desc limit 1;
$$;

revoke execute on function public.lifetime_points(uuid) from public, anon, authenticated;
revoke execute on function public.level_for(integer) from public, anon, authenticated;

-- What the app needs: your lifetime points, and whether your next
-- collected order still gets the welcome double.
create or replace function public.my_loyalty()
returns table (lifetime_points integer, first_order_bonus boolean)
language sql
stable
security definer
set search_path = public
as $$
  select
    public.lifetime_points(auth.uid()),
    not exists (select 1 from public.point_events where user_id = auth.uid() and source = 'order');
$$;

revoke execute on function public.my_loyalty() from public, anon;
grant execute on function public.my_loyalty() to authenticated;

-- ------------------------------------------------------------------
-- Orders: 10 points per euro, doubled on your first order, else plus
-- your level's bonus (counted from your lifetime points before it).
-- ------------------------------------------------------------------
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
  if new.status = 'collected' and old.status is distinct from 'collected' and new.total_cents > 0 then
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
  return new;
end;
$$;

-- ------------------------------------------------------------------
-- Rewards that only a level can claim. Priced in whole stamps like the
-- rest; with the level's bonus they come round sooner.
-- ------------------------------------------------------------------
alter table public.rewards add column if not exists min_level text references public.levels (key);

insert into public.rewards (id, title, description, cost_points, discount_cents, active, min_level) values
  ('00000000-0000-0000-0000-0000000000a5', 'Mongmo tote bag', 'For Rising and up: the canvas tote, yours to keep', 400, null, true, 'rising'),
  ('00000000-0000-0000-0000-0000000000a6', 'Free Vietnamese stew', 'For Golden and up: bò kho or gà cà ri, your pick', 1200, null, true, 'golden'),
  ('00000000-0000-0000-0000-0000000000a7', '2 free bánh mì', 'For Crisp: one for you, one for a friend', 1500, null, true, 'crisp')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  cost_points = excluded.cost_points,
  discount_cents = excluded.discount_cents,
  active = excluded.active,
  min_level = excluded.min_level;

-- ------------------------------------------------------------------
-- redeem_reward: as before (balance, expiry), and a level reward needs
-- that level.
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
  v_level public.levels%rowtype;
  v_user_reward public.user_rewards%rowtype;
begin
  select * into v_reward from public.rewards where id = p_reward_id and active;
  if not found then
    raise exception 'Reward not found';
  end if;

  if v_reward.expires_at is not null and v_reward.expires_at < now() then
    raise exception 'This reward has expired';
  end if;

  if v_reward.min_level is not null then
    select * into v_level from public.levels where key = v_reward.min_level;
    if public.lifetime_points(auth.uid()) < v_level.min_points then
      raise exception 'Reach % to unlock this reward', v_level.name;
    end if;
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
