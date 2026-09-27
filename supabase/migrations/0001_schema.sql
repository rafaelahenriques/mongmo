-- Mongmo core schema.
-- Tables map 1:1 to the domains described in AGENTS.md: stores, events,
-- challenges, check-ins, badges, rewards and order-ahead pickup.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------
-- Profiles (one row per auth.users row; role gates owner-only screens)
-- ------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'owner')),
  name text not null default '',
  bio text not null default '',
  avatar_url text,
  home_city text,
  leaderboard_visible boolean not null default true,
  member_since timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Menus (menu templates, independent of where they are served)
-- ------------------------------------------------------------------
create table public.menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus (id) on delete cascade,
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  image_url text,
  category text,
  sort_order integer not null default 0,
  available boolean not null default true
);

create index menu_items_menu_id_idx on public.menu_items (menu_id);

-- ------------------------------------------------------------------
-- Stores (the one permanent café) and events (pop-ups)
-- ------------------------------------------------------------------
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  time_zone text not null,
  hours jsonb not null default '{}'::jsonb,
  amenities text[] not null default '{}',
  capacity integer not null default 0,
  occupancy integer not null default 0,
  phone text,
  order_url text,
  menu_id uuid references public.menus (id),
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null,
  city text not null,
  venue text not null,
  latitude double precision not null,
  longitude double precision not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  time_zone text not null,
  description text not null default '',
  image_url text,
  tags text[] not null default '{}',
  capacity integer not null default 0,
  occupancy integer not null default 0,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'ended', 'cancelled')),
  qr_token text not null default encode(gen_random_bytes(12), 'hex'),
  order_url text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint events_window_check check (ends_at > starts_at)
);

create unique index events_qr_token_idx on public.events (qr_token);
create index events_starts_at_idx on public.events (starts_at);
create index events_status_idx on public.events (status);

create table public.event_menus (
  event_id uuid not null references public.events (id) on delete cascade,
  menu_id uuid not null references public.menus (id) on delete cascade,
  primary key (event_id, menu_id)
);

-- ------------------------------------------------------------------
-- Challenges (generic engine: one shared shape, per-type UI on the client)
-- ------------------------------------------------------------------
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  type text not null check (
    type in (
      'explore', 'check_in', 'capture', 'taste', 'social',
      'timing', 'collection', 'discovery', 'streak', 'community'
    )
  ),
  title text not null,
  description text not null default '',
  points integer not null default 0 check (points >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index challenges_event_id_idx on public.challenges (event_id);

-- ------------------------------------------------------------------
-- Check-ins (physical attendance, verified server-side) and challenge
-- completions (engagement) — kept distinct from orders (transactions).
-- ------------------------------------------------------------------
create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  verified_by_qr boolean not null default false,
  unique (user_id, event_id)
);

create index check_ins_user_id_idx on public.check_ins (user_id);
create index check_ins_event_id_idx on public.check_ins (event_id);

create table public.challenge_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now(),
  unique (user_id, challenge_id)
);

create index challenge_completions_user_id_idx on public.challenge_completions (user_id);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  challenge_id uuid references public.challenges (id),
  storage_path text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create index photos_event_id_idx on public.photos (event_id);

-- ------------------------------------------------------------------
-- Badges (fixed global ladder, developer-defined) and the points ledger.
-- Points are event-sourced (one row per award/spend) rather than a single
-- running total, so the weekly leaderboard can sum an actual time window.
-- ------------------------------------------------------------------
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  description text not null,
  emoji text,
  points integer not null default 0 check (points >= 0),
  sort_order integer not null default 0
);

create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create table public.point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  points integer not null,
  source text not null check (source in ('challenge_completion', 'badge', 'reward_redeemed')),
  source_id uuid,
  created_at timestamptz not null default now()
);

create index point_events_user_id_idx on public.point_events (user_id);
create index point_events_created_at_idx on public.point_events (created_at);

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  cost_points integer not null check (cost_points > 0),
  discount_cents integer check (discount_cents >= 0),
  expires_at timestamptz,
  active boolean not null default true
);

create table public.user_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  reward_id uuid not null references public.rewards (id),
  redeemed_at timestamptz not null default now(),
  used_at timestamptz
);

create index user_rewards_user_id_idx on public.user_rewards (user_id);

-- ------------------------------------------------------------------
-- Orders (order-ahead pickup) — snapshot fields keep history accurate.
-- ------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  store_id uuid references public.stores (id),
  event_id uuid references public.events (id),
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  total_cents integer not null default 0,
  status text not null default 'draft' check (
    status in ('draft', 'paid', 'preparing', 'ready', 'collected', 'cancelled')
  ),
  pickup_at timestamptz,
  user_reward_id uuid references public.user_rewards (id),
  created_at timestamptz not null default now(),
  constraint orders_single_location check ((store_id is not null) <> (event_id is not null))
);

create index orders_user_id_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id),
  name_snapshot text not null,
  unit_price_cents_snapshot integer not null check (unit_price_cents_snapshot >= 0),
  quantity integer not null check (quantity > 0),
  line_total_cents integer not null check (line_total_cents >= 0)
);

create index order_items_order_id_idx on public.order_items (order_id);
