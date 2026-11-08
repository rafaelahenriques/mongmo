-- The café's real data, for every project: production, staging and local.
-- The menu, the Kortrijk café, the badges and the rewards. No pop-ups:
-- staff create real ones in the app (Owner tools → New pop-up).
--
-- Run it once on a new project, after the migrations: paste it into the
-- dashboard's SQL Editor and Run (`supabase db push` doesn't run it). It's
-- safe to run again, but running it again resets the menu items and
-- rewards to what's written here, so after launch change the menu in the
-- app or the dashboard instead. Demo pop-ups for testing are in seed.sql.

-- ------------------------------------------------------------------
-- Menu: the board at the café, shared by the store and every event.
-- Item names say what the kitchen makes ("Bánh mì, crispy pork belly");
-- the app shows them under their section without the repeat. Extras and
-- dips are options, chosen on an item's page (see below).
-- ------------------------------------------------------------------
insert into public.menus (id, name, description, active) values
  ('00000000-0000-0000-0000-0000000000d1', 'Mongmo pop-up menu', 'Bánh mì, springrolls and Vietnamese stews, available until sold out.', true)
on conflict (id) do update set description = excluded.description;

insert into public.menu_items (id, menu_id, name, description, price_cents, category, sort_order, available) values
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000d1', 'Bánh mì, chicken lemongrass', 'Lemongrass chicken, pickles, herbs', 1050, 'Bánh mì', 1, true),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000d1', 'Bánh mì, crispy pork belly', 'Crispy pork belly, pickles, herbs', 1050, 'Bánh mì', 2, true),
  ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-0000000000d1', 'Bánh mì, grilled meatballs', 'Grilled meatballs, pickles, herbs', 1050, 'Bánh mì', 3, true),
  ('00000000-0000-0000-0000-0000000000d5', '00000000-0000-0000-0000-0000000000d1', 'Bánh mì, fried tofu', 'Fried tofu, pickles, herbs', 1050, 'Bánh mì', 4, true),
  ('00000000-0000-0000-0000-0000000000d6', '00000000-0000-0000-0000-0000000000d1', 'Springrolls, chicken lemongrass', null, 500, 'Springrolls', 5, true),
  ('00000000-0000-0000-0000-0000000000d7', '00000000-0000-0000-0000-0000000000d1', 'Springrolls, grilled meatballs', null, 500, 'Springrolls', 6, true),
  ('00000000-0000-0000-0000-0000000000d8', '00000000-0000-0000-0000-0000000000d1', 'Springrolls, fried tofu', null, 500, 'Springrolls', 7, true),
  ('00000000-0000-0000-0000-0000000000d9', '00000000-0000-0000-0000-0000000000d1', 'Springrolls, eggs', null, 500, 'Springrolls', 8, true),
  ('00000000-0000-0000-0000-0000000000da', '00000000-0000-0000-0000-0000000000d1', 'Additional protein', 'In your bánh mì or springrolls', 100, 'Extras', 9, true),
  ('00000000-0000-0000-0000-0000000000db', '00000000-0000-0000-0000-0000000000d1', 'Mango dip', null, 0, 'Choose your dip', 10, true),
  ('00000000-0000-0000-0000-0000000000dc', '00000000-0000-0000-0000-0000000000d1', 'Peanut dip', null, 0, 'Choose your dip', 11, true),
  ('00000000-0000-0000-0000-0000000000dd', '00000000-0000-0000-0000-0000000000d1', 'Bò kho (beef stew)', null, 1650, 'Vietnamese stews', 12, true),
  ('00000000-0000-0000-0000-0000000000de', '00000000-0000-0000-0000-0000000000d1', 'Gà cà ri (chicken stew)', null, 1650, 'Vietnamese stews', 13, true),
  ('00000000-0000-0000-0000-0000000000df', '00000000-0000-0000-0000-0000000000d1', 'Bánh mì without filling', null, 150, 'Bánh mì without filling', 14, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  category = excluded.category,
  sort_order = excluded.sort_order,
  available = excluded.available;

-- Options (0017_item_options.sql): picked on the item's own page, not
-- the menu. Extra protein for bánh mì and springrolls, a dip with
-- springrolls.
update public.menu_items set add_on_for = '{Bánh mì,Springrolls}'
  where id = '00000000-0000-0000-0000-0000000000da';
update public.menu_items set add_on_for = '{Springrolls}'
  where id in ('00000000-0000-0000-0000-0000000000db', '00000000-0000-0000-0000-0000000000dc');

-- ------------------------------------------------------------------
-- Store: the one permanent Mongmo café, Kortrijk.
-- ------------------------------------------------------------------
insert into public.stores (
  id, name, address, latitude, longitude, time_zone, hours, amenities, capacity, occupancy, phone, order_url, menu_id
) values (
  '00000000-0000-0000-0000-000000000001',
  'Mongmo',
  'Jan Palfijnstraat 26, 8500 Kortrijk',
  50.8289, 3.2664,
  'Europe/Brussels',
  '{
    "mon": null, "tue": null, "wed": null,
    "thu": {"open": "10:00", "close": "18:00"},
    "fri": {"open": "10:00", "close": "18:00"},
    "sat": {"open": "10:00", "close": "18:00"},
    "sun": {"open": "10:00", "close": "16:00"}
  }'::jsonb,
  array['Fresh bakery daily', 'Pickup & delivery', 'Card payment', 'Vegetarian friendly'],
  40, 11,
  '+32 56 94 43 81',
  'https://bestel.mongmo-store.com/nl',
  '00000000-0000-0000-0000-0000000000d1'
)
on conflict (id) do nothing;

-- ------------------------------------------------------------------
-- Badges: the fixed, developer-defined achievement ladder.
-- ------------------------------------------------------------------
insert into public.badges (key, title, description, points, sort_order) values
  ('first-sip', 'First Sip', 'Check in to your first pop-up', 10, 1),
  ('popup-scout', 'Pop-up Scout', 'Check in to 2 pop-ups', 25, 2),
  ('street-food-fan', 'Street Food Fan', 'Check in to 4 pop-ups', 40, 3),
  ('local-legend', 'Local Legend', 'Check in to 6 pop-ups', 50, 4),
  ('memory-maker', 'Memory Maker', 'Complete 3 challenges', 40, 5),
  ('first-order', 'First Order', 'Place your first order', 25, 6),
  ('regular', 'Regular', 'Place 3 orders', 50, 7),
  ('event-eater', 'Event Eater', 'Order at 2 different pop-ups', 25, 8),
  ('city-hopper', 'City Hopper', 'Check in to pop-ups in 2 different cities', 25, 9),
  ('event-hopper', 'Event Hopper', 'Check in at 3 different pop-ups', 40, 10),
  ('shutterbug', 'Shutterbug', 'Complete 3 photo challenges', 25, 11),
  ('taste-tester', 'Taste Tester', 'Complete 2 tasting challenges', 25, 12),
  ('challenge-champion', 'Challenge Champion', 'Complete 10 challenges', 50, 13),
  ('night-owl', 'Night Owl', 'Check in at a pop-up after 21:00', 15, 14),
  ('dance-machine', 'Dance Machine', 'Fill a dance meter', 20, 15),
  ('crowd-voice', 'Voice of the Crowd', 'Vote in 2 polls', 15, 16),
  ('early-bird', 'Early Bird', 'Beat the clock on a timing challenge', 15, 17)
on conflict (key) do nothing;

-- ------------------------------------------------------------------
-- Rewards: kept deliberately simple (flat discounts or a free item),
-- per AGENTS.md's guidance to avoid stacked/percentage reward rules.
-- ------------------------------------------------------------------
insert into public.rewards (id, title, description, cost_points, discount_cents, active) values
  ('00000000-0000-0000-0000-0000000000a1', 'Mongmo sticker pack', 'Limited pop-up artwork, 4 pieces', 200, null, true),
  ('00000000-0000-0000-0000-0000000000a2', '€2 off your order', 'Comes off at checkout', 400, 200, true),
  ('00000000-0000-0000-0000-0000000000a3', 'Free springrolls', 'Any filling, with your dip', 500, null, true),
  ('00000000-0000-0000-0000-0000000000a4', 'Free bánh mì', 'Any filling, your pick', 1000, null, true)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  cost_points = excluded.cost_points,
  discount_cents = excluded.discount_cents;
