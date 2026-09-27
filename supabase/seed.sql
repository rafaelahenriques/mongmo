-- Local/demo seed data, modeled on the real Mongmo site (mongmo-store.com)
-- and its published pop-up calendar. Not meant for a production project.
--
-- `supabase db reset` applies this automatically for a local project, but
-- `supabase db push` does NOT — for a hosted project, paste this file into
-- the dashboard's SQL Editor (see supabase/README.md). It's safe to re-run:
-- every insert is idempotent, and re-running refreshes the pop-up dates so
-- there's always one live, one upcoming and one past event to try.

-- ------------------------------------------------------------------
-- Menu: Mongmo's core Vietnamese menu, shared by the store and every event.
-- ------------------------------------------------------------------
insert into public.menus (id, name, description, active) values
  ('00000000-0000-0000-0000-0000000000d1', 'Mongmo pop-up menu', 'Vietnamese coffee and pastries, available until sold out.', true)
on conflict (id) do nothing;

insert into public.menu_items (id, menu_id, name, description, price_cents, category, sort_order, available) values
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000d1', 'Bánh mì', 'Grilled pork, pickled vegetables & coriander', 650, 'savoury', 1, true),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000d1', 'Chả giò', 'Crispy spring rolls, 4 pieces', 500, 'savoury', 2, true),
  ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-0000000000d1', 'Cà phê sữa đá', 'Iced coffee with condensed milk', 350, 'drinks', 3, true),
  ('00000000-0000-0000-0000-0000000000d5', '00000000-0000-0000-0000-0000000000d1', 'Bánh flan', 'Coconut crème caramel', 400, 'sweets', 4, true)
on conflict (id) do nothing;

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
-- Events: three pop-ups, Kortrijk and Antwerpen, dated relative to when
-- this runs (Brussels wall-clock time) instead of fixed calendar dates,
-- which would all be in the past a few days after writing them.
--   e1: ended two days ago
--   e2: upcoming, in three days
--   e3: live right now (started an hour ago, ends in five) — the one with
--       challenges, so check-in and the challenge engine can be tried today.
-- ------------------------------------------------------------------
insert into public.events (
  id, title, type, city, venue, latitude, longitude, starts_at, ends_at, time_zone,
  description, image_url, tags, capacity, occupancy, status, order_url
) values
  (
    '00000000-0000-0000-0000-0000000000e1',
    'Bar Amorse × Mongmo', 'bar-takeover', 'Kortrijk', 'In front of Mongmo, Jan Palfijnstraat 26',
    50.8300, 3.2685,
    (date_trunc('day', now() at time zone 'Europe/Brussels') - interval '2 days' + interval '17 hours') at time zone 'Europe/Brussels',
    (date_trunc('day', now() at time zone 'Europe/Brussels') - interval '2 days' + interval '23 hours') at time zone 'Europe/Brussels',
    'Europe/Brussels',
    'Bar Amorse takes over the street in front of Mongmo for an evening of natural wine, records and Vietnamese bar snacks.',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
    array['Food & drinks', 'Music'], 80, 18, 'ended', 'https://bestel.mongmo-store.com/nl'
  ),
  (
    '00000000-0000-0000-0000-0000000000e2',
    'Moonfest Chinatown Antwerpen', 'city-pop-up', 'Antwerpen', 'Van Wesenbekestraat, Chinatown',
    51.2178, 4.4175,
    (date_trunc('day', now() at time zone 'Europe/Brussels') + interval '3 days' + interval '12 hours') at time zone 'Europe/Brussels',
    (date_trunc('day', now() at time zone 'Europe/Brussels') + interval '3 days' + interval '22 hours') at time zone 'Europe/Brussels',
    'Europe/Brussels',
    'Moonfest lights up Antwerp''s Chinatown with lanterns, street food and live performances — Mongmo brings a full bakery stand.',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    array['Festival', 'Street food'], 400, 140, 'scheduled', 'https://bestel.mongmo-store.com/nl'
  ),
  (
    '00000000-0000-0000-0000-0000000000e3',
    'Bar Amorse × Mongmo', 'bar-takeover', 'Kortrijk', 'In front of Mongmo, Jan Palfijnstraat 26',
    50.8279, 3.2649,
    date_trunc('hour', now()) - interval '1 hour',
    date_trunc('hour', now()) + interval '5 hours',
    'Europe/Brussels',
    'A wrap-up session with Bar Amorse: brunch plates, coffee from the bakery and slow records on the street.',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    array['Food & drinks', 'Music'], 80, 9, 'live', 'https://bestel.mongmo-store.com/nl'
  ),
  (
    '00000000-0000-0000-0000-0000000000e4',
    'Mongmo Nights: Vinahouse DJ set', 'bar-takeover', 'Gent', 'Vooruit terrace, Sint-Pietersnieuwstraat 23',
    51.0457, 3.7277,
    (date_trunc('day', now() at time zone 'Europe/Brussels') + interval '1 days' + interval '20 hours') at time zone 'Europe/Brussels',
    (date_trunc('day', now() at time zone 'Europe/Brussels') + interval '1 days' + interval '26 hours') at time zone 'Europe/Brussels',
    'Europe/Brussels',
    'DJ Minh Vu spins Vinahouse and city pop until late, with bánh mì and iced coffee from the truck.',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
    array['Music', 'Late night'], 250, 0, 'scheduled', 'https://bestel.mongmo-store.com/nl'
  ),
  (
    '00000000-0000-0000-0000-0000000000e5',
    'Cà phê sunrise at Kortrijk station', 'food-truck', 'Kortrijk', 'Stationsplein, next to the bike shed',
    50.8248, 3.2645,
    (date_trunc('day', now() at time zone 'Europe/Brussels') + interval '5 days' + interval '7 hours 30 minutes') at time zone 'Europe/Brussels',
    (date_trunc('day', now() at time zone 'Europe/Brussels') + interval '5 days' + interval '11 hours') at time zone 'Europe/Brussels',
    'Europe/Brussels',
    'Phin-filtered coffee and warm bánh bao for the morning commute. Bring your own cup for a small discount.',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    array['Coffee', 'Breakfast'], 60, 0, 'scheduled', 'https://bestel.mongmo-store.com/nl'
  ),
  (
    '00000000-0000-0000-0000-0000000000e6',
    'Bánh mì truck at Flagey', 'food-truck', 'Brussel', 'Place Flagey, by the ponds',
    50.8275, 4.3721,
    (date_trunc('day', now() at time zone 'Europe/Brussels') + interval '8 days' + interval '11 hours 30 minutes') at time zone 'Europe/Brussels',
    (date_trunc('day', now() at time zone 'Europe/Brussels') + interval '8 days' + interval '15 hours 30 minutes') at time zone 'Europe/Brussels',
    'Europe/Brussels',
    'The full bánh mì line-up for the lunch crowd in Ixelles — pork, lemongrass tofu and the weekly special.',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    array['Street food', 'Lunch'], 120, 0, 'scheduled', 'https://bestel.mongmo-store.com/nl'
  ),
  (
    '00000000-0000-0000-0000-0000000000e7',
    'Tết lantern market Brugge', 'city-pop-up', 'Brugge', 'Markt, in front of the Belfry',
    51.2089, 3.2247,
    (date_trunc('day', now() at time zone 'Europe/Brussels') + interval '13 days' + interval '16 hours') at time zone 'Europe/Brussels',
    (date_trunc('day', now() at time zone 'Europe/Brussels') + interval '13 days' + interval '22 hours') at time zone 'Europe/Brussels',
    'Europe/Brussels',
    'Lanterns, lion dancers and a Mongmo stall full of sweets for the Lunar New Year — bring the whole family.',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    array['Festival', 'Family'], 500, 0, 'scheduled', 'https://bestel.mongmo-store.com/nl'
  )
on conflict (id) do update set
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  status = excluded.status;

insert into public.event_menus (event_id, menu_id)
select id, '00000000-0000-0000-0000-0000000000d1'
from public.events
where id in (
  '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e2',
  '00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000e4',
  '00000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-0000000000e6',
  '00000000-0000-0000-0000-0000000000e7'
)
on conflict do nothing;

-- Every pop-up gets its own themed challenges, and every one has a photo
-- challenge. Re-running the seed refreshes their settings too, so timing
-- windows follow the pop-ups' new dates.
insert into public.challenges (id, event_id, type, title, description, points, sort_order, config) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000e3', 'check_in', 'Scan in at Bar Amorse', 'Scan the event QR code when you arrive.', 20, 1, '{}'::jsonb),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000e3', 'taste', 'Rate the bánh mì', 'Tell us what you thought after you eat.', 15, 2, '{"dish": "bánh mì"}'::jsonb),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000e3', 'social', 'Bring a friend', 'Share the pop-up with someone new.', 25, 3, '{"message": "Brunch, records and bánh mì in front of Mongmo — come join me!"}'::jsonb),
  ('00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-0000000000e3', 'discovery', 'Find the hidden sticker', 'Look for the Mongmo sticker somewhere on the street.', 20, 4, '{"photoCount": 1, "hint": "It’s on something green."}'::jsonb),
  ('00000000-0000-0000-0000-0000000000c5', '00000000-0000-0000-0000-0000000000e3', 'capture', 'Brunch in frame', 'Two shots: what you ordered, and where you are.', 20, 5, '{"photoCount": 2, "prompt": "your plate and the street behind it"}'::jsonb),
  ('00000000-0000-0000-0000-0000000000c6', '00000000-0000-0000-0000-0000000000e3', 'timing', 'Golden hour', 'Claim it in the next two hours.', 15, 6, jsonb_build_object('startsAt', now(), 'endsAt', now() + interval '2 hours')),
  ('00000000-0000-0000-0000-0000000000c7', '00000000-0000-0000-0000-0000000000e3', 'community', 'Next month’s special', 'Help us pick what goes on the menu.', 10, 7, '{"options": ["Bún chả", "Phở gà", "Bánh xèo"]}'::jsonb),
  ('00000000-0000-0000-0000-0000000000c8', '00000000-0000-0000-0000-0000000000e3', 'collection', 'Taste tour', 'Order two different dishes here.', 30, 8, '{"dishCount": 2}'::jsonb),
  ('00000000-0000-0000-0000-0000000000c9', '00000000-0000-0000-0000-0000000000e4', 'motion', 'Dance meter', 'Get on the floor — the meter fills while you move.', 30, 1, '{"seconds": 30}'::jsonb),
  ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-0000000000e4', 'capture', 'Crowd shot', 'Show us the night.', 20, 2, '{"photoCount": 2, "prompt": "the dance floor and the DJ booth"}'::jsonb),
  ('00000000-0000-0000-0000-0000000000cb', '00000000-0000-0000-0000-0000000000e4', 'community', 'Pick the next set', 'The crowd decides what Minh plays at midnight.', 10, 3, '{"options": ["Vinahouse", "City pop", "Deep house"]}'::jsonb),
  ('00000000-0000-0000-0000-0000000000cc', '00000000-0000-0000-0000-0000000000e4', 'timing', 'Doors-open crew', 'For everyone there in the first hour.', 15, 4, '{}'::jsonb),
  ('00000000-0000-0000-0000-0000000000cd', '00000000-0000-0000-0000-0000000000e4', 'streak', 'Night crawler', 'Three Mongmo pop-ups, any city.', 40, 5, '{"popupCount": 3}'::jsonb),
  ('00000000-0000-0000-0000-0000000000ce', '00000000-0000-0000-0000-0000000000e2', 'capture', 'Lantern light', 'Chinatown after dark.', 20, 1, '{"photoCount": 2, "prompt": "the lanterns after dark"}'::jsonb),
  ('00000000-0000-0000-0000-0000000000cf', '00000000-0000-0000-0000-0000000000e2', 'collection', 'Street food crawl', 'Three different dishes from our stand.', 35, 2, '{"dishCount": 3}'::jsonb),
  ('00000000-0000-0000-0000-0000000001c0', '00000000-0000-0000-0000-0000000000e2', 'explore', 'Find the Mongmo stand', 'It’s somewhere on Van Wesenbekestraat.', 15, 3, '{"radiusM": 200}'::jsonb),
  ('00000000-0000-0000-0000-0000000001c1', '00000000-0000-0000-0000-0000000000e2', 'taste', 'Rate the bánh flan', 'Our coconut crème caramel, festival edition.', 15, 4, '{"dish": "bánh flan"}'::jsonb),
  ('00000000-0000-0000-0000-0000000001c2', '00000000-0000-0000-0000-0000000000e2', 'community', 'Best lantern colour', 'Vote for your favourite.', 10, 5, '{"options": ["Red", "Gold", "Jade"]}'::jsonb),
  ('00000000-0000-0000-0000-0000000001c3', '00000000-0000-0000-0000-0000000000e2', 'motion', 'Lion dance', 'Dance along when the lion comes by.', 25, 6, '{"seconds": 20}'::jsonb),
  ('00000000-0000-0000-0000-0000000001c4', '00000000-0000-0000-0000-0000000000e5', 'capture', 'Latte art', 'Before the first sip.', 15, 1, '{"photoCount": 1, "prompt": "your cà phê before the first sip"}'::jsonb),
  ('00000000-0000-0000-0000-0000000001c5', '00000000-0000-0000-0000-0000000000e5', 'taste', 'Cà phê sữa đá', 'How strong do you like it?', 15, 2, '{"dish": "cà phê sữa đá"}'::jsonb),
  ('00000000-0000-0000-0000-0000000001c6', '00000000-0000-0000-0000-0000000000e5', 'timing', 'Early riser', 'For the first hour of the morning.', 20, 3, '{}'::jsonb),
  ('00000000-0000-0000-0000-0000000001c7', '00000000-0000-0000-0000-0000000000e5', 'social', 'Coffee buddy', 'Bring someone for their first phin coffee.', 20, 4, '{"message": "Cà phê sữa đá at Kortrijk station — see you there?"}'::jsonb),
  ('00000000-0000-0000-0000-0000000001c8', '00000000-0000-0000-0000-0000000000e6', 'capture', 'Cross-section', 'The best way to show a bánh mì.', 20, 1, '{"photoCount": 1, "prompt": "your bánh mì, cut in half"}'::jsonb),
  ('00000000-0000-0000-0000-0000000001c9', '00000000-0000-0000-0000-0000000000e6', 'collection', 'Full order', 'A bánh mì and something on the side.', 25, 2, '{"dishCount": 2}'::jsonb),
  ('00000000-0000-0000-0000-0000000001ca', '00000000-0000-0000-0000-0000000000e6', 'explore', 'At the truck', 'By the ponds on Place Flagey.', 10, 3, '{"radiusM": 150}'::jsonb),
  ('00000000-0000-0000-0000-0000000001cb', '00000000-0000-0000-0000-0000000000e6', 'discovery', 'Spot the sticker', 'There’s a Mongmo sticker on the truck.', 20, 4, '{"photoCount": 1, "hint": "Look low, near the wheels."}'::jsonb),
  ('00000000-0000-0000-0000-0000000001cc', '00000000-0000-0000-0000-0000000000e7', 'capture', 'Family photo', 'Everyone under the lanterns.', 20, 1, '{"photoCount": 1, "prompt": "your crew under the lanterns"}'::jsonb),
  ('00000000-0000-0000-0000-0000000001cd', '00000000-0000-0000-0000-0000000000e7', 'motion', 'Lion dance', 'Dance with the lion for good luck.', 25, 2, '{"seconds": 20}'::jsonb),
  ('00000000-0000-0000-0000-0000000001ce', '00000000-0000-0000-0000-0000000000e7', 'community', 'Wish for the year', 'What are you wishing for?', 10, 3, '{"options": ["Health", "Luck", "Love"]}'::jsonb),
  ('00000000-0000-0000-0000-0000000001cf', '00000000-0000-0000-0000-0000000000e7', 'discovery', 'The golden lantern', 'One lantern carries the Mongmo logo.', 25, 4, '{"photoCount": 1, "hint": "Only one lantern is gold."}'::jsonb),
  ('00000000-0000-0000-0000-0000000001d0', '00000000-0000-0000-0000-0000000000e1', 'capture', 'Natural wine & records', 'The evening in one photo.', 20, 1, '{"photoCount": 1, "prompt": "your glass and the records"}'::jsonb)
on conflict (id) do update set
  type = excluded.type,
  title = excluded.title,
  description = excluded.description,
  points = excluded.points,
  sort_order = excluded.sort_order,
  config = excluded.config;

-- The demo pop-ups bring their own photo challenges; drop the generic one
-- migration 0014 gives any upcoming pop-up that had none.
delete from public.challenges
where title = 'Snap the pop-up'
  and event_id::text like '00000000-0000-0000-0000-0000000000e%';

-- ------------------------------------------------------------------
-- Badges: the fixed, developer-defined achievement ladder.
-- ------------------------------------------------------------------
insert into public.badges (key, title, description, points, sort_order) values
  ('first-sip', 'First Sip', 'Check in to your first pop-up', 25, 1),
  ('popup-scout', 'Pop-up Scout', 'Check in to 2 pop-ups', 50, 2),
  ('street-food-fan', 'Street Food Fan', 'Check in to 4 pop-ups', 75, 3),
  ('local-legend', 'Local Legend', 'Check in to 6 pop-ups', 100, 4),
  ('memory-maker', 'Memory Maker', 'Complete 3 challenges', 75, 5),
  ('first-order', 'First Order', 'Place your first order', 25, 6),
  ('regular', 'Regular', 'Place 3 orders', 75, 7),
  ('event-eater', 'Event Eater', 'Order at 2 different pop-ups', 50, 8)
on conflict (key) do nothing;

-- ------------------------------------------------------------------
-- Rewards: kept deliberately simple (flat discounts or a free item),
-- per AGENTS.md's guidance to avoid stacked/percentage reward rules.
-- ------------------------------------------------------------------
insert into public.rewards (id, title, description, cost_points, discount_cents, active) values
  ('00000000-0000-0000-0000-0000000000a1', 'Mongmo sticker pack', 'Limited pop-up artwork, 4 pieces', 100, null, true),
  ('00000000-0000-0000-0000-0000000000a2', '€2 off your next order', 'Pickup or delivery, one-time use', 150, 200, true),
  ('00000000-0000-0000-0000-0000000000a3', 'Free cà phê sữa đá', 'Any size, on us', 200, null, true),
  ('00000000-0000-0000-0000-0000000000a4', 'Free bánh mì', 'Grilled pork or tofu, your pick', 350, null, true)
on conflict (id) do nothing;
