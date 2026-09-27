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
  | 'community';

export type OrderStatus = 'draft' | 'paid' | 'preparing' | 'ready' | 'collected' | 'cancelled';

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
  bio: string;
  avatar_url: string | null;
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
};

type ChallengeRow = {
  id: string;
  event_id: string;
  type: ChallengeType;
  title: string;
  description: string;
  points: number;
  sort_order: number;
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
  url: string;
  created_at: string;
};

type BadgeRow = {
  id: string;
  key: string;
  title: string;
  description: string;
  emoji: string | null;
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
  source: 'challenge_completion' | 'badge' | 'reward_redeemed';
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
};

type OrderItemRow = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name_snapshot: string;
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
      user_rewards: Table<UserRewardRow>;
      orders: Table<OrderRow>;
      order_items: Table<OrderItemRow>;
    };
    Functions: {
      my_points_balance: { Args: Record<string, never>; Returns: number };
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
        Returns: { user_id: string; name: string; points: number }[];
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
      confirm_mock_payment: {
        Args: { p_order_id: string };
        Returns: OrderRow;
      };
      advance_order_status: {
        Args: { p_order_id: string; p_status: string };
        Returns: OrderRow;
      };
    };
  };
};
