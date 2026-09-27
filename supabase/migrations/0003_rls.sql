-- Row Level Security. Nothing the client can write directly grants points,
-- badges, a check-in, or an order total — those all go through the
-- SECURITY DEFINER functions in 0002_functions.sql, which run as the table
-- owner and so aren't blocked by the (deliberately absent) write policies
-- below.

alter table public.profiles enable row level security;
alter table public.menus enable row level security;
alter table public.menu_items enable row level security;
alter table public.stores enable row level security;
alter table public.events enable row level security;
alter table public.event_menus enable row level security;
alter table public.challenges enable row level security;
alter table public.check_ins enable row level security;
alter table public.challenge_completions enable row level security;
alter table public.photos enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.point_events enable row level security;
alter table public.rewards enable row level security;
alter table public.user_rewards enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- profiles: everyone manages their own row; other users' public info (for
-- the leaderboard) is served by the leaderboard() function instead.
create policy "profiles select own" on public.profiles
  for select to authenticated using (auth.uid() = id or public.is_owner());

create policy "profiles update own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Publicly readable catalog/location data; owner-managed writes.
create policy "stores readable" on public.stores
  for select to authenticated using (true);
create policy "stores owner writes" on public.stores
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "events readable" on public.events
  for select to authenticated using (true);
create policy "events owner writes" on public.events
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "challenges readable" on public.challenges
  for select to authenticated using (true);
create policy "challenges owner writes" on public.challenges
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "menus readable" on public.menus
  for select to authenticated using (true);
create policy "menus owner writes" on public.menus
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "menu items readable" on public.menu_items
  for select to authenticated using (true);
create policy "menu items owner writes" on public.menu_items
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "event menus readable" on public.event_menus
  for select to authenticated using (true);
create policy "event menus owner writes" on public.event_menus
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- Fixed, developer-defined catalogs: readable, never client-writable.
create policy "badges readable" on public.badges
  for select to authenticated using (true);

create policy "rewards readable" on public.rewards
  for select to authenticated using (true);

-- Per-user activity: readable by its own owner (and the app owner, for
-- order/event management); writable only through the RPCs above.
create policy "check ins select own" on public.check_ins
  for select to authenticated using (auth.uid() = user_id or public.is_owner());

create policy "challenge completions select own" on public.challenge_completions
  for select to authenticated using (auth.uid() = user_id or public.is_owner());

-- Photos are a public per-event gallery ("photos from past attendees").
create policy "photos readable" on public.photos
  for select to authenticated using (true);
create policy "photos insert own" on public.photos
  for insert to authenticated with check (auth.uid() = user_id);

create policy "user badges select own" on public.user_badges
  for select to authenticated using (auth.uid() = user_id);

create policy "point events select own" on public.point_events
  for select to authenticated using (auth.uid() = user_id);

create policy "user rewards select own" on public.user_rewards
  for select to authenticated using (auth.uid() = user_id);

create policy "orders select own" on public.orders
  for select to authenticated using (auth.uid() = user_id or public.is_owner());

create policy "order items select own" on public.order_items
  for select to authenticated using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_owner())
    )
  );
