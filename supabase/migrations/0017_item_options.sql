-- Item options: a dip with springrolls, extra protein in a bánh mì.
--
-- An option is an ordinary menu item that names the sections it goes with
-- (`add_on_for`, e.g. {Springrolls}). It isn't ordered on its own: the app
-- shows it on the item's own screen, and the order line carries it. The
-- server prices it into the line and keeps its name on the line, so the
-- kitchen reads "Springrolls, fried tofu — Peanut dip, Additional protein".

alter table public.menu_items add column if not exists add_on_for text[];

comment on column public.menu_items.add_on_for is
  'Menu sections (menu_items.category) this item is an option for; null for a normal item.';

alter table public.order_items add column if not exists options_snapshot text;

comment on column public.order_items.options_snapshot is
  'The options chosen for this line, by name, as ordered ("Peanut dip, Additional protein").';

-- create_order, as before, plus each item's optional "options": an array
-- of menu item ids. Each must be an available option for that item's
-- section at this location; its price is added to the line.
create or replace function public.create_order(
  p_store_id uuid,
  p_event_id uuid,
  p_items jsonb,
  p_pickup_at timestamptz,
  p_user_reward_id uuid default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_menu_item public.menu_items%rowtype;
  v_option public.menu_items%rowtype;
  v_option_id uuid;
  v_quantity integer;
  v_unit integer;
  v_options text;
  v_subtotal integer := 0;
  v_discount integer := 0;
  v_order public.orders%rowtype;
  v_user_reward public.user_rewards%rowtype;
  v_reward public.rewards%rowtype;
  v_allowed_menu_ids uuid[];
begin
  if (p_store_id is null) = (p_event_id is null) then
    raise exception 'Order must have exactly one of store_id or event_id';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  if p_store_id is not null then
    select array_remove(array[menu_id], null) into v_allowed_menu_ids
      from public.stores where id = p_store_id;
  else
    select array_agg(menu_id) into v_allowed_menu_ids
      from public.event_menus where event_id = p_event_id;
  end if;

  if v_allowed_menu_ids is null or array_length(v_allowed_menu_ids, 1) is null then
    raise exception 'No menu is available for this location';
  end if;

  insert into public.orders (user_id, store_id, event_id, pickup_at)
  values (auth.uid(), p_store_id, p_event_id, p_pickup_at)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Invalid quantity';
    end if;

    select * into v_menu_item from public.menu_items
      where id = (v_item ->> 'menu_item_id')::uuid
        and available
        and menu_id = any (v_allowed_menu_ids);

    if not found then
      raise exception 'One of the items is not available at this location';
    end if;

    if v_menu_item.add_on_for is not null then
      raise exception '% goes with another item: add it on that item''s page', v_menu_item.name;
    end if;

    v_unit := v_menu_item.price_cents;
    v_options := null;

    if jsonb_typeof(v_item -> 'options') = 'array' then
      for v_option_id in select (jsonb_array_elements_text(v_item -> 'options'))::uuid
      loop
        select * into v_option from public.menu_items
          where id = v_option_id
            and available
            and menu_id = any (v_allowed_menu_ids)
            and v_menu_item.category = any (add_on_for);

        if not found then
          raise exception 'One of the options for % is not available', v_menu_item.name;
        end if;

        v_unit := v_unit + v_option.price_cents;
        v_options := concat_ws(', ', v_options, v_option.name);
      end loop;
    end if;

    insert into public.order_items (
      order_id, menu_item_id, name_snapshot, options_snapshot, unit_price_cents_snapshot, quantity, line_total_cents
    )
    values (
      v_order.id, v_menu_item.id, v_menu_item.name, v_options, v_unit, v_quantity, v_unit * v_quantity
    );

    v_subtotal := v_subtotal + v_unit * v_quantity;
  end loop;

  if p_user_reward_id is not null then
    select * into v_user_reward from public.user_rewards
      where id = p_user_reward_id and user_id = auth.uid() and used_at is null;
    if not found then
      raise exception 'That reward is not available to use';
    end if;

    select * into v_reward from public.rewards where id = v_user_reward.reward_id;
    if v_reward.expires_at is not null and v_reward.expires_at < now() then
      raise exception 'This reward has expired';
    end if;

    v_discount := least(coalesce(v_reward.discount_cents, 0), v_subtotal);
    update public.user_rewards set used_at = now() where id = v_user_reward.id;
  end if;

  update public.orders
    set subtotal_cents = v_subtotal,
        discount_cents = v_discount,
        total_cents = greatest(v_subtotal - v_discount, 0),
        user_reward_id = v_user_reward.id
    where id = v_order.id
    returning * into v_order;

  return v_order;
end;
$$;
