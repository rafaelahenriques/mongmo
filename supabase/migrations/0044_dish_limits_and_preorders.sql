-- How many of each dish a place can sell, and pre-orders for pop-ups.
--
-- Dish limits: staff set, for a dish at a place, the most that can be
-- ordered. At a pop-up it's for the whole pop-up; at the café it's per day
-- (the pickup day, in the café's time zone). An order that would go over is
-- refused, saying how many are left, and the app shows "Hurry, only N left"
-- at 10 or fewer and "Sold out" at none. What counts: orders placed, being
-- made, ready or collected, and orders still being paid for (a draft from
-- the last 30 minutes). Cancelled ones don't. Options (a sauce, coriander)
-- aren't dishes and have no limit.
--
-- Pre-orders: a pop-up takes orders from 24 hours before it starts, for a
-- pickup time during it. They count toward the same limits.

create table if not exists public.dish_limits (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  store_id uuid references public.stores (id) on delete cascade,
  event_id uuid references public.events (id) on delete cascade,
  max_quantity integer not null check (max_quantity between 0 and 10000),
  updated_at timestamptz not null default now(),
  -- One place: the café or a pop-up.
  constraint dish_limits_one_place check ((store_id is null) <> (event_id is null))
);

create unique index if not exists dish_limits_store_item on public.dish_limits (store_id, menu_item_id)
  where store_id is not null;
create unique index if not exists dish_limits_event_item on public.dish_limits (event_id, menu_item_id)
  where event_id is not null;
create index if not exists dish_limits_menu_item_id_idx on public.dish_limits (menu_item_id);

-- Read and written through the functions below; staff can also read the table.
alter table public.dish_limits enable row level security;
drop policy if exists "dish limits readable by staff" on public.dish_limits;
create policy "dish limits readable by staff" on public.dish_limits
  for select to authenticated using (public.is_owner());
revoke all on public.dish_limits from anon, authenticated;
grant select on public.dish_limits to authenticated;

-- How many of a dish are taken at a place: at a pop-up over all of it, at
-- the café on one day. A person's own unfinished orders (p_user_id) don't
-- count against them, so closing the payment and changing the cart doesn't
-- hold their dishes twice; the order being made (p_order_id) does.
create or replace function public.dish_sold(
  p_menu_item_id uuid,
  p_store_id uuid,
  p_event_id uuid,
  p_day date,
  p_user_id uuid default null,
  p_order_id uuid default null
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(oi.quantity), 0)::integer
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
   where oi.menu_item_id = p_menu_item_id
     and (
       o.status in ('placed', 'preparing', 'ready', 'collected')
       or (
         o.status = 'draft'
         and o.created_at > now() - interval '30 minutes'
         and (o.user_id is distinct from p_user_id or o.id = p_order_id)
       )
     )
     and (
       (p_event_id is not null and o.event_id = p_event_id)
       or (
         p_store_id is not null
         and o.store_id = p_store_id
         and (coalesce(o.pickup_at, o.created_at) at time zone (
           select s.time_zone from public.stores s where s.id = p_store_id
         ))::date = p_day
       )
     );
$$;

revoke execute on function public.dish_sold(uuid, uuid, uuid, date, uuid, uuid) from public, anon, authenticated;

-- Before each order line goes in: if its dish has a limit at the order's
-- place, refuse what would go over. The limit's row is locked first, so
-- two orders for the last ones can't both get through.
create or replace function public.enforce_dish_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store_id uuid;
  v_event_id uuid;
  v_when timestamptz;
  v_max integer;
  v_day date;
  v_left integer;
  v_name text;
  v_user_id uuid;
begin
  select o.store_id, o.event_id, coalesce(o.pickup_at, o.created_at), o.user_id
    into v_store_id, v_event_id, v_when, v_user_id
    from public.orders o where o.id = new.order_id;

  select l.max_quantity into v_max
    from public.dish_limits l
   where l.menu_item_id = new.menu_item_id
     and ((v_event_id is not null and l.event_id = v_event_id) or (v_store_id is not null and l.store_id = v_store_id))
     for update;
  if not found then
    return new;
  end if;

  if v_store_id is not null then
    select (v_when at time zone s.time_zone)::date into v_day from public.stores s where s.id = v_store_id;
  end if;

  v_left := greatest(
    v_max - public.dish_sold(new.menu_item_id, v_store_id, v_event_id, v_day, v_user_id, new.order_id),
    0
  );
  if new.quantity > v_left then
    select m.name into v_name from public.menu_items m where m.id = new.menu_item_id;
    if v_left = 0 then
      raise exception '% is sold out%.', v_name,
        case when v_store_id is not null then ' for that day' else ' here' end
        using errcode = 'P0001';
    end if;
    raise exception 'Only % left of %. Order % or fewer.', v_left, v_name, v_left using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_dish_limits() from public, anon, authenticated;

drop trigger if exists order_items_enforce_dish_limits on public.order_items;
create trigger order_items_enforce_dish_limits
  before insert on public.order_items
  for each row execute function public.enforce_dish_limits();

-- What's left of each limited dish at a place: today at the café unless
-- another day is given, over the whole of a pop-up. Everyone signed in
-- sees what's left (not counting their own unfinished orders); only staff
-- see how many were ordered.
create or replace function public.dish_stock(p_store_id uuid, p_event_id uuid, p_day date default null)
returns table (menu_item_id uuid, max_quantity integer, sold integer, remaining integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_day date := p_day;
  v_staff boolean := public.is_owner();
begin
  if (p_store_id is null) = (p_event_id is null) then
    raise exception 'Ask for one place: the café or a pop-up' using errcode = '22023';
  end if;
  if p_store_id is not null and v_day is null then
    select (now() at time zone s.time_zone)::date into v_day from public.stores s where s.id = p_store_id;
  end if;

  return query
    select l.menu_item_id,
           l.max_quantity,
           case when v_staff then taken.n end,
           greatest(l.max_quantity - taken.n, 0)
      from public.dish_limits l
      cross join lateral (
        select public.dish_sold(l.menu_item_id, p_store_id, p_event_id, v_day, auth.uid()) as n
      ) taken
     where (p_event_id is not null and l.event_id = p_event_id)
        or (p_store_id is not null and l.store_id = p_store_id);
end;
$$;

revoke execute on function public.dish_stock(uuid, uuid, date) from public, anon;
grant execute on function public.dish_stock(uuid, uuid, date) to authenticated;

-- Staff set the limits of one place at once: [{menu_item_id, max_quantity}],
-- a null max_quantity taking a dish's limit away.
create or replace function public.set_dish_limits(p_store_id uuid, p_event_id uuid, p_limits jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entry jsonb;
  v_item uuid;
  v_max integer;
begin
  if not public.is_owner() then
    raise exception 'Only staff can set how many of a dish there are' using errcode = '42501';
  end if;
  if (p_store_id is null) = (p_event_id is null) then
    raise exception 'Set limits for one place: the café or a pop-up' using errcode = '22023';
  end if;
  if jsonb_typeof(p_limits) is distinct from 'array' then
    raise exception 'Limits come as a list' using errcode = '22023';
  end if;

  for v_entry in select * from jsonb_array_elements(p_limits)
  loop
    v_item := (v_entry ->> 'menu_item_id')::uuid;
    if jsonb_typeof(v_entry -> 'max_quantity') is distinct from 'number' then
      delete from public.dish_limits
       where menu_item_id = v_item
         and store_id is not distinct from p_store_id
         and event_id is not distinct from p_event_id;
      continue;
    end if;

    v_max := (v_entry ->> 'max_quantity')::integer;
    if v_max < 0 or v_max > 10000 then
      raise exception 'A limit is a number from 0 to 10000' using errcode = '22023';
    end if;
    if p_event_id is not null then
      insert into public.dish_limits (menu_item_id, event_id, max_quantity)
      values (v_item, p_event_id, v_max)
      on conflict (event_id, menu_item_id) where event_id is not null
      do update set max_quantity = excluded.max_quantity, updated_at = now();
    else
      insert into public.dish_limits (menu_item_id, store_id, max_quantity)
      values (v_item, p_store_id, v_max)
      on conflict (store_id, menu_item_id) where store_id is not null
      do update set max_quantity = excluded.max_quantity, updated_at = now();
    end if;
  end loop;
end;
$$;

revoke execute on function public.set_dish_limits(uuid, uuid, jsonb) from public, anon;
grant execute on function public.set_dish_limits(uuid, uuid, jsonb) to authenticated;

-- Pre-orders: a pop-up takes orders from 24 hours before it starts (it
-- used to wait until it started), for a pickup time during it.
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
  if now() > v_ends_at then
    raise exception 'This pop-up has ended';
  end if;
  if now() < v_starts_at - interval '24 hours' then
    raise exception 'Pre-orders open 24 hours before the pop-up starts (%)',
      to_char((v_starts_at - interval '24 hours') at time zone v_time_zone, 'Dy DD Mon, HH24:MI');
  end if;
  -- A pre-order needs a time during the pop-up; at a live one, none means now.
  if (now() < v_starts_at and new.pickup_at is null)
     or (new.pickup_at is not null and (new.pickup_at < v_starts_at or new.pickup_at > v_ends_at)) then
    raise exception 'Pick a time during the pop-up';
  end if;
  return new;
end;
$$;
