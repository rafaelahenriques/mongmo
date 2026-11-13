-- Paying online with Stripe, next to paying at the counter (0031).
--
-- How an online payment goes:
--   1. The app makes the draft order (create_order works out the total).
--   2. The payment-sheet Edge Function creates a Stripe PaymentIntent for
--      exactly that total and records it here (attach_payment_intent).
--   3. The customer pays in Stripe's payment sheet (card, Apple Pay,
--      Google Pay, Bancontact). Card details only ever go to Stripe.
--   4. Stripe tells the stripe-webhook Edge Function, which checks the
--      signature and calls mark_order_paid: the order is paid and placed.
--      The app never decides that an order is paid.
--
-- Cancelling a paid order (by the customer, or by staff) marks it for a
-- refund; the refund-order Edge Function asks Stripe for it, and the
-- webhook marks it refunded.
--
-- Only the service role (the Edge Functions) can call the payment
-- functions below. Idempotent.

alter table public.orders drop constraint if exists orders_payment_check;
alter table public.orders add constraint orders_payment_check check (payment in ('at_pickup', 'online'));

alter table public.orders
  add column if not exists stripe_payment_intent_id text,
  add column if not exists refund_status text,
  add column if not exists refunded_at timestamptz;

alter table public.orders drop constraint if exists orders_refund_status_check;
alter table public.orders add constraint orders_refund_status_check
  check (refund_status is null or refund_status in ('pending', 'refunded', 'failed'));

create unique index if not exists orders_stripe_payment_intent_id_key
  on public.orders (stripe_payment_intent_id) where stripe_payment_intent_id is not null;

-- Paying at pickup: placing a draft order. An order already paid online
-- keeps saying so (a payment that went through just before the customer
-- chose to pay at the counter instead).
create or replace function public.place_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  update public.orders
     set status = 'placed',
         payment = case when paid_at is null then 'at_pickup' else payment end
   where id = p_order_id and user_id = auth.uid() and status = 'draft'
  returning * into v_order;
  if not found then
    raise exception 'That order can''t be placed';
  end if;

  perform public.evaluate_badges(auth.uid());
  return v_order;
end;
$$;

-- Edge Function (payment-sheet): the order to charge, checked for its
-- owner. Only a draft with something to pay can be paid online.
create or replace function public.order_for_payment(p_order_id uuid, p_user_id uuid)
returns public.orders
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders
   where id = p_order_id and user_id = p_user_id and status = 'draft' and paid_at is null;
  if not found then
    raise exception 'That order can''t be paid' using errcode = 'P0002';
  end if;
  if v_order.total_cents <= 0 then
    raise exception 'There''s nothing to pay on that order' using errcode = '22023';
  end if;
  return v_order;
end;
$$;

-- Edge Function (payment-sheet): the PaymentIntent created for an order.
create or replace function public.attach_payment_intent(p_order_id uuid, p_intent_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
     set stripe_payment_intent_id = p_intent_id, payment = 'online'
   where id = p_order_id and status = 'draft' and paid_at is null;
  if not found then
    raise exception 'That order can''t be paid' using errcode = 'P0002';
  end if;
end;
$$;

-- Edge Function (stripe-webhook): Stripe says the payment succeeded. Only
-- the exact amount for the order counts. A draft is placed; an order
-- placed meanwhile to pay at pickup becomes paid online. Returns the
-- order's status after, or null if there's no such order, so the webhook
-- can refund a payment for an order that's gone or cancelled.
create or replace function public.mark_order_paid(p_intent_id text, p_order_id uuid, p_amount_cents integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    return null;
  end if;
  if v_order.stripe_payment_intent_id is distinct from p_intent_id then
    raise exception 'The payment doesn''t belong to that order' using errcode = '22023';
  end if;
  if p_amount_cents <> v_order.total_cents then
    raise exception 'The amount paid doesn''t match the order' using errcode = '22023';
  end if;
  if v_order.paid_at is not null then
    return v_order.status;
  end if;

  update public.orders
     set paid_at = now(),
         payment = 'online',
         status = case when status = 'draft' then 'placed' else status end
   where id = p_order_id
  returning * into v_order;

  if v_order.status = 'placed' then
    perform public.evaluate_badges(v_order.user_id);
  end if;
  return v_order.status;
end;
$$;

-- Edge Functions: how a refund is going ('pending', 'refunded', 'failed').
-- Once refunded it stays refunded, whichever message arrives last.
create or replace function public.set_refund_status(p_intent_id text, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
     set refund_status = p_status,
         refunded_at = case when p_status = 'refunded' then coalesce(refunded_at, now()) else refunded_at end
   where stripe_payment_intent_id = p_intent_id
     and refund_status is distinct from 'refunded';
end;
$$;

-- Edge Function (refund-order): a cancelled, paid order waiting for its
-- refund, if the caller may ask for it: its customer, or staff.
create or replace function public.order_for_refund(p_order_id uuid, p_user_id uuid)
returns public.orders
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_staff boolean;
begin
  select role = 'owner' into v_staff from public.profiles where id = p_user_id;
  select * into v_order from public.orders
   where id = p_order_id
     and (user_id = p_user_id or coalesce(v_staff, false))
     and status = 'cancelled'
     and payment = 'online'
     and paid_at is not null
     and refund_status in ('pending', 'failed');
  if not found then
    raise exception 'That order has no refund to make' using errcode = 'P0002';
  end if;
  return v_order;
end;
$$;

-- Cancelling: a paid online order is marked for its refund. Otherwise as
-- before (0032): the customer until the café starts, staff any time, and
-- a reward used comes back.
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
     set status = 'cancelled',
         refund_status = case when payment = 'online' and paid_at is not null then 'pending' else refund_status end
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
         paid_at = case when p_status = 'collected' then coalesce(paid_at, now()) else paid_at end,
         refund_status = case
           when p_status = 'cancelled' and payment = 'online' and paid_at is not null and refund_status is null
             then 'pending'
           else refund_status
         end
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

revoke execute on function public.place_order(uuid) from public, anon;
grant execute on function public.place_order(uuid) to authenticated;
revoke execute on function public.cancel_my_order(uuid) from public, anon;
grant execute on function public.cancel_my_order(uuid) to authenticated;
revoke execute on function public.advance_order_status(uuid, text) from public, anon;
grant execute on function public.advance_order_status(uuid, text) to authenticated;

revoke execute on function public.order_for_payment(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.attach_payment_intent(uuid, text) from public, anon, authenticated;
revoke execute on function public.mark_order_paid(text, uuid, integer) from public, anon, authenticated;
revoke execute on function public.set_refund_status(text, text) from public, anon, authenticated;
revoke execute on function public.order_for_refund(uuid, uuid) from public, anon, authenticated;
grant execute on function public.order_for_payment(uuid, uuid) to service_role;
grant execute on function public.attach_payment_intent(uuid, text) to service_role;
grant execute on function public.mark_order_paid(text, uuid, integer) to service_role;
grant execute on function public.set_refund_status(text, text) to service_role;
grant execute on function public.order_for_refund(uuid, uuid) to service_role;
