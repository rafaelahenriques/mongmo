-- Local/demo seed data, modeled on the real Mongmo site (mongmo-store.com)
-- and its published pop-up calendar. Re-applied whenever you run
-- `supabase db reset`. Not meant for a production project.

-- ------------------------------------------------------------------
-- Menu: Mongmo's core Vietnamese menu, shared by the store and every event.
-- ------------------------------------------------------------------
insert into public.menus (id, name, description, active) values
  ('00000000-0000-0000-0000-0000000000d1', 'Mongmo pop-up menu', 'Vietnamese coffee and pastries, available until sold out.', true);

insert into public.menu_items (id, menu_id, name, description, price_cents, category, sort_order, available) values
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000d1', 'Bánh mì', 'Grilled pork, pickled vegetables & coriander', 650, 'savoury', 1, true),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000d1', 'Chả giò', 'Crispy spring rolls, 4 pieces', 500, 'savoury', 2, true),
  ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-0000000000d1', 'Cà phê sữa đá', 'Iced coffee with condensed milk', 350, 'drinks', 3, true),
  ('00000000-0000-0000-0000-0000000000d5', '00000000-0000-0000-0000-0000000000d1', 'Bánh flan', 'Coconut crème caramel', 400, 'sweets', 4, true);

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
);

-- ------------------------------------------------------------------
-- Events: three pop-ups, Kortrijk and Antwerpen.
-- ------------------------------------------------------------------
insert into public.events (
  id, title, type, city, venue, latitude, longitude, starts_at, ends_at, time_zone,
  description, image_url, tags, capacity, occupancy, status, order_url
) values
  (
    '00000000-0000-0000-0000-0000000000e1',
    'Bar Amorse × Mongmo', 'bar-takeover', 'Kortrijk', 'In front of Mongmo, Jan Palfijnstraat 26',
    50.8300, 3.2685, '2026-09-25T17:00:00+02:00', '2026-09-25T23:00:00+02:00', 'Europe/Brussels',
    'Bar Amorse takes over the street in front of Mongmo for an evening of natural wine, records and Vietnamese bar snacks.',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
    array['Food & drinks', 'Music'], 80, 18, 'ended', 'https://bestel.mongmo-store.com/nl'
  ),
  (
    '00000000-0000-0000-0000-0000000000e2',
    'Moonfest Chinatown Antwerpen', 'city-pop-up', 'Antwerpen', 'Van Wesenbekestraat, Chinatown',
    51.2178, 4.4175, '2026-09-26T12:00:00+02:00', '2026-09-26T22:00:00+02:00', 'Europe/Brussels',
    'Moonfest lights up Antwerp''s Chinatown with lanterns, street food and live performances — Mongmo brings a full bakery stand.',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    array['Festival', 'Street food'], 400, 140, 'ended', 'https://bestel.mongmo-store.com/nl'
  ),
  (
    '00000000-0000-0000-0000-0000000000e3',
    'Bar Amorse × Mongmo', 'bar-takeover', 'Kortrijk', 'In front of Mongmo, Jan Palfijnstraat 26',
    50.8279, 3.2649, '2026-09-27T12:00:00+02:00', '2026-09-27T18:00:00+02:00', 'Europe/Brussels',
    'A Sunday wrap-up session with Bar Amorse: brunch plates, coffee from the bakery and slow records on the street.',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    array['Food & drinks', 'Music'], 80, 9, 'live', 'https://bestel.mongmo-store.com/nl'
  );

insert into public.event_menus (event_id, menu_id) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000d1');

-- One challenge per category on the live event, so the generic engine has
-- something of every type to render.
insert into public.challenges (event_id, type, title, description, points, sort_order) values
  ('00000000-0000-0000-0000-0000000000e3', 'check_in', 'Scan in at Bar Amorse', 'Scan the event QR code when you arrive.', 20, 1),
  ('00000000-0000-0000-0000-0000000000e3', 'taste', 'Rate the bánh mì', 'Tell us what you thought after you eat.', 15, 2),
  ('00000000-0000-0000-0000-0000000000e3', 'social', 'Bring a friend', 'Share your referral code with someone new.', 25, 3),
  ('00000000-0000-0000-0000-0000000000e3', 'discovery', 'Find the hidden sticker', 'Look for the Mongmo sticker somewhere on the street.', 20, 4);

-- ------------------------------------------------------------------
-- Badges: the fixed, developer-defined achievement ladder.
-- ------------------------------------------------------------------
insert into public.badges (key, title, description, emoji, points, sort_order) values
  ('first-sip', 'First Sip', 'Check in to your first pop-up', '🎯', 25, 1),
  ('popup-scout', 'Pop-up Scout', 'Check in to 2 pop-ups', '🧭', 50, 2),
  ('street-food-fan', 'Street Food Fan', 'Check in to 4 pop-ups', '🥡', 75, 3),
  ('local-legend', 'Local Legend', 'Check in to 6 pop-ups', '🏆', 100, 4),
  ('memory-maker', 'Memory Maker', 'Complete 3 challenges', '📸', 75, 5),
  ('first-order', 'First Order', 'Place your first order', '🧋', 25, 6),
  ('regular', 'Regular', 'Place 3 orders', '🔁', 75, 7),
  ('event-eater', 'Event Eater', 'Order at 2 different pop-ups', '🍜', 50, 8);

-- ------------------------------------------------------------------
-- Rewards: kept deliberately simple (flat discounts or a free item),
-- per AGENTS.md's guidance to avoid stacked/percentage reward rules.
-- ------------------------------------------------------------------
insert into public.rewards (title, description, cost_points, discount_cents, active) values
  ('Mongmo sticker pack', 'Limited pop-up artwork, 4 pieces', 100, null, true),
  ('€2 off your next order', 'Pickup or delivery, one-time use', 150, 200, true),
  ('Free cà phê sữa đá', 'Any size, on us', 200, null, true),
  ('Free bánh mì', 'Grilled pork or tofu, your pick', 350, null, true);
