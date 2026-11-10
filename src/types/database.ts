/**
 * Hand-written mirror of supabase/migrations — table shapes (snake_case, as
 * Postgres returns them) plus the RPC signatures the app calls. Once a real
 * project is linked, this can be regenerated with
 * `supabase gen types typescript --linked` and this file replaced wholesale.
 *
 * Row shapes are named aliases (not inlined into `Database` and not read
 * back out of it) so a function's `Returns` can reuse a table's `Row`
 * without a self-referential `Database['public']['Tables'][...]` lookup —
 * that circularity is enough to make supabase-js's select-string parser
 * give up and fall back to `GenericStringError` on every table, not just
 * the one involved.
 */

type WeeklyHoursJson = Record<
  'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
  { open: string; close: string } | null
>;

export type ChallengeType =
  | 'explore'
  | 'check_in'
  | 'capture'
  | 'taste'
  | 'social'
  | 'timing'
  | 'collection'
  | 'discovery'
  | 'streak'
  | 'community'
  | 'motion';

/** `placed`: ordered, to pay at pickup (0031). */
export type OrderStatus = 'draft' | 'placed' | 'preparing' | 'ready' | 'collected' | 'cancelled';

type Table<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type ProfileRow = {
  id: string;
  role: 'customer' | 'owner';
  name: string;
  avatar_url: string | null;
  /** The profile photo in the private `avatars` bucket: "<id>/<file>". */
  avatar_path: string | null;
  home_city: string | null;
  leaderboard_visible: boolean;
  member_since: string;
};

type StoreRow = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  time_zone: string;
  hours: WeeklyHoursJson;
  amenities: string[];
  capacity: number;
  occupancy: number;
  phone: string | null;
  order_url: string | null;
  menu_id: string | null;
  created_at: string;
};

type EventRow = {
  id: string;
  title: string;
  type: string;
  city: string;
  venue: string;
  latitude: number;
  longitude: number;
  starts_at: string;
  ends_at: string;
  time_zone: string;
  description: string;
  image_url: string | null;
  tags: string[];
  capacity: number;
  occupancy: number;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  qr_token: string;
  order_url: string | null;
  created_by: string | null;
  created_at: string;
};

type EventMenuRow = { event_id: string; menu_id: string };

type MenuRow = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
};

type MenuItemRow = {
  id: string;
  menu_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  category: string | null;
  sort_order: number;
  available: boolean;
  /** Sections this item is an option for (0017); null for a normal item. */
  add_on_for: string[] | null;
};

type ChallengeRow = {
  id: string;
  event_id: string;
  type: ChallengeType;
  title: string;
  description: string;
  points: number;
  sort_order: number;
  /** Per-type settings, normalized by the server (see 0012_challenge_settings.sql). */
  config: Record<string, unknown>;
  created_at: string;
};

type CheckInRow = {
  id: string;
  user_id: string;
  event_id: string;
  checked_in_at: string;
  verified_by_qr: boolean;
};

type ChallengeCompletionRow = {
  id: string;
  user_id: string;
  challenge_id: string;
  data: Record<string, unknown>;
  completed_at: string;
};

type PhotoRow = {
  id: string;
  user_id: string;
  event_id: string;
  challenge_id: string | null;
  storage_path: string;
  created_at: string;
  /** Shared in Photos of the week since (0029); null while private. */
  shared_at: string | null;
  /** Taken down after a report; it can't be shared again unless staff put it back. */
  removed_at: string | null;
  /** When staff decided on a report (0030), and what. */
  reviewed_at: string | null;
  review_outcome: 'restored' | 'kept_down' | null;
};

type BadgeRow = {
  id: string;
  key: string;
  title: string;
  description: string;
  points: number;
  sort_order: number;
};

type UserBadgeRow = {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
};

type PointEventRow = {
  id: string;
  user_id: string;
  points: number;
  source: 'challenge_completion' | 'badge' | 'reward_redeemed' | 'order';
  source_id: string | null;
  created_at: string;
};

type RewardRow = {
  id: string;
  title: string;
  description: string;
  cost_points: number;
  discount_cents: number | null;
  expires_at: string | null;
  active: boolean;
  /** A level's own reward: only that level (or higher) can redeem it. */
  min_level: string | null;
};

type LevelRow = {
  key: string;
  name: string;
  min_points: number;
  order_bonus_pct: number;
  perk: string;
};

type UserRewardRow = {
  id: string;
  user_id: string;
  reward_id: string;
  redeemed_at: string;
  used_at: string | null;
};

type OrderRow = {
  id: string;
  user_id: string;
  store_id: string | null;
  event_id: string | null;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  status: OrderStatus;
  pickup_at: string | null;
  user_reward_id: string | null;
  created_at: string;
  /** How it's paid: at the counter on pickup (the only way for now). */
  payment: 'at_pickup';
  /** When staff took the payment: set as they mark it collected. */
  paid_at: string | null;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name_snapshot: string;
  /** The options chosen for the line, by name (0017). */
  options_snapshot: string | null;
  unit_price_cents_snapshot: number;
  quantity: number;
  line_total_cents: number;
};

export type Database = {
  public: {
    Views: Record<string, never>;
    Tables: {
      profiles: Table<ProfileRow>;
      stores: Table<StoreRow>;
      events: Table<EventRow>;
      event_menus: Table<EventMenuRow>;
      menus: Table<MenuRow>;
      menu_items: Table<MenuItemRow>;
      challenges: Table<ChallengeRow>;
      check_ins: Table<CheckInRow>;
      challenge_completions: Table<ChallengeCompletionRow>;
      photos: Table<PhotoRow>;
      badges: Table<BadgeRow>;
      user_badges: Table<UserBadgeRow>;
      point_events: Table<PointEventRow>;
      rewards: Table<RewardRow>;
      levels: Table<LevelRow>;
      user_rewards: Table<UserRewardRow>;
      orders: Table<OrderRow>;
      order_items: Table<OrderItemRow>;
    };
    Functions: {
      my_points_balance: { Args: Record<string, never>; Returns: number };
      my_loyalty: {
        Args: Record<string, never>;
        Returns: { lifetime_points: number; first_order_bonus: boolean }[];
      };
      export_my_data: { Args: Record<string, never>; Returns: Record<string, unknown> };
      set_photo_shared: { Args: { p_photo_id: string; p_shared: boolean }; Returns: undefined };
      report_photo: { Args: { p_photo_id: string }; Returns: undefined };
      reported_photos: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          storage_path: string;
          event_title: string;
          taken_at: string;
          removed_at: string;
          reports: number;
        }[];
      };
      review_reported_photo: { Args: { p_photo_id: string; p_restore: boolean }; Returns: undefined };
      delete_reported_photo: { Args: { p_photo_id: string }; Returns: undefined };
      photos_of_the_week: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          storage_path: string;
          event_id: string;
          event_title: string;
          shared_at: string;
          mine: boolean;
        }[];
      };
      delete_my_account: { Args: Record<string, never>; Returns: undefined };
      ensure_profile: { Args: Record<string, never>; Returns: undefined };
      my_badge_progress: {
        Args: Record<string, never>;
        Returns: { key: string; current: number; target: number }[];
      };
      my_stats: {
        Args: Record<string, never>;
        Returns: {
          events_attended: number;
          cities_visited: number;
          challenges_completed: number;
          orders_count: number;
        }[];
      };
      leaderboard: {
        Args: { p_period: 'weekly' | 'all' };
        Returns: { user_id: string; name: string; points: number; avatar_path: string | null }[];
      };
      verify_check_in: {
        Args: {
          p_event_id: string;
          p_qr_token: string;
          p_latitude: number;
          p_longitude: number;
        };
        Returns: CheckInRow;
      };
      complete_challenge: {
        Args: { p_challenge_id: string; p_data?: Record<string, unknown> };
        Returns: ChallengeCompletionRow;
      };
      redeem_reward: {
        Args: { p_reward_id: string };
        Returns: UserRewardRow;
      };
      create_order: {
        Args: {
          p_store_id: string | null;
          p_event_id: string | null;
          p_items: { menu_item_id: string; quantity: number }[];
          p_pickup_at: string | null;
          p_user_reward_id?: string | null;
        };
        Returns: OrderRow;
      };
      place_order: {
        Args: { p_order_id: string };
        Returns: OrderRow;
      };
      cancel_my_order: {
        Args: { p_order_id: string };
        Returns: OrderRow;
      };
      advance_order_status: {
        Args: { p_order_id: string; p_status: string };
        Returns: OrderRow;
      };
      get_event_qr_token: {
        Args: { p_event_id: string };
        Returns: string;
      };
    };
  };
};
