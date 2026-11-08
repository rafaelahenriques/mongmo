-- Customers can cancel an order they placed by mistake, until the café
-- starts on it (status 'placed'; once staff accept it, it's 'preparing').
-- With payment at pickup, a mistaken order would otherwise be made and
-- never collected.
--
-- Whoever cancels, a reward used on the order is given back: it's unused
-- again and can go on the next order.

create or replace function public.cancel_my_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  update public.orders
     set status = 'cancelled'
   where id = p_order_id and user_id = auth.uid() and status = 'placed'
  returning * into v_order;
  if not found then
    raise exception 'This order can''t be cancelled any more: the café has started on it';
  end if;

  if v_order.user_reward_id is not null then
    update public.user_rewards set used_at = null where id = v_order.user_reward_id;
  end if;
  return v_order;
end;
$$;

revoke execute on function public.cancel_my_order(uuid) from public, anon;
grant execute on function public.cancel_my_order(uuid) to authenticated;

-- Staff cancelling gives the reward back too.
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

  if p_status = 'cancelled' and v_order.user_reward_id is not null then
    update public.user_rewards set used_at = null where id = v_order.user_reward_id;
  end if;

  return v_order;
end;
$$;
