-- The owner's order board downloaded every order ever placed, and again
-- every 15 seconds: it grows with each order, and the follow-up lookup
-- of names and lines put every order id in one URL. The board only needs:
--   * everything still with the kitchen (placed, preparing, ready),
--     however old;
--   * what was collected or cancelled since p_since (its pickup time, or
--     when it was placed for "as soon as possible");
--   * any cancelled order whose online refund isn't confirmed yet.
--
-- security invoker: the orders RLS policies still decide what a caller
-- sees (an owner sees every order, anyone else only their own).

create or replace function public.owner_board_orders(p_since timestamptz)
returns setof public.orders
language sql
stable
security invoker
set search_path = ''
as $$
  select o.*
  from public.orders o
  where o.status in ('placed', 'preparing', 'ready')
     or (o.status in ('collected', 'cancelled') and coalesce(o.pickup_at, o.created_at) >= p_since)
     or (o.status = 'cancelled' and o.refund_status in ('pending', 'failed'))
  order by o.created_at;
$$;

revoke all on function public.owner_board_orders(timestamptz) from public, anon;
grant execute on function public.owner_board_orders(timestamptz) to authenticated;

-- The second condition is the only one over finished orders, which are
-- nearly all of them; this keeps it to the last day's rows.
create index if not exists orders_finished_at_idx
  on public.orders ((coalesce(pickup_at, created_at)))
  where status in ('collected', 'cancelled');

-- A customer's order history, newest first (My orders).
create index if not exists orders_user_id_created_at_idx on public.orders (user_id, created_at desc);
drop index if exists public.orders_user_id_idx;
