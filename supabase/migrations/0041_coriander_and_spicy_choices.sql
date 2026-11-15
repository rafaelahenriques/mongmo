-- Coriander and spicy are two separate choices, each made every time:
-- with or without coriander, spicy or not. They were two switches in one
-- "Options" group, which the app version on phones until now showed as one
-- pick-one choice: coriander *or* spicy.
--
-- Each is now its own pick-one group (a name starting with "Choose"), with
-- both answers as options. The first is what's picked unless the customer
-- changes it: with coriander, not spicy. Both are free, so every app
-- version shows them as pick-one, and the kitchen ticket always says which
-- (e.g. "No coriander, Spicy"). The same rows as supabase/base.sql, for
-- projects that already have the starting menu.
do $$
declare
  v_menu constant uuid := '00000000-0000-0000-0000-0000000000d1';
begin
  if not exists (select 1 from public.menus where id = v_menu) then
    return;
  end if;

  insert into public.menu_items (id, menu_id, name, description, price_cents, category, sort_order, available, add_on_for) values
    ('00000000-0000-0000-0000-0000000000e0', v_menu, 'With coriander', null, 0, 'Choose coriander', 12, true, '{Bánh mì,Springrolls}'),
    ('00000000-0000-0000-0000-0000000000e5', v_menu, 'No coriander', null, 0, 'Choose coriander', 13, true, '{Bánh mì,Springrolls}'),
    ('00000000-0000-0000-0000-0000000000e6', v_menu, 'Not spicy', null, 0, 'Choose how spicy', 14, true, '{Bánh mì,Springrolls}'),
    ('00000000-0000-0000-0000-0000000000e1', v_menu, 'Spicy', null, 0, 'Choose how spicy', 15, true, '{Bánh mì,Springrolls}')
  on conflict (id) do update set
    name = excluded.name,
    price_cents = excluded.price_cents,
    category = excluded.category,
    sort_order = excluded.sort_order,
    add_on_for = excluded.add_on_for;

  -- Everything after them moves down two places.
  update public.menu_items set sort_order = 16 where id = '00000000-0000-0000-0000-0000000000e2';
  update public.menu_items set sort_order = 17 where id = '00000000-0000-0000-0000-0000000000e3';
  update public.menu_items set sort_order = 18 where id = '00000000-0000-0000-0000-0000000000dd';
  update public.menu_items set sort_order = 19 where id = '00000000-0000-0000-0000-0000000000de';
  update public.menu_items set sort_order = 20 where id = '00000000-0000-0000-0000-0000000000df';
end;
$$;
