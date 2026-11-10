import type { Database } from '@/types/database';
import type { BadgeDefinition, MenuItem, PopUpEvent, ProfileStats, Reward, Store, UserProfile } from '@/types';

type StoreRow = Database['public']['Tables']['stores']['Row'];
type EventRow = Database['public']['Tables']['events']['Row'];
type MenuItemRow = Database['public']['Tables']['menu_items']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type BadgeRow = Database['public']['Tables']['badges']['Row'];
type RewardRow = Database['public']['Tables']['rewards']['Row'];

export function menuItemRowToMenuItem(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
  };
}

export function storeRowToStore(row: StoreRow): Store {
  return {
    type: 'store',
    id: row.id,
    name: row.name,
    address: row.address,
    coordinates: { latitude: row.latitude, longitude: row.longitude },
    timeZone: row.time_zone,
    hours: row.hours,
    amenities: row.amenities,
    busy: { occupancy: row.occupancy, capacity: row.capacity },
    phone: row.phone ?? '',
    orderUrl: row.order_url ?? '',
  };
}

export function eventRowToEvent(row: EventRow, menuItemRows: MenuItemRow[] = []): PopUpEvent {
  return {
    type: 'event',
    id: row.id,
    title: row.title,
    city: row.city,
    venue: row.venue,
    coordinates: { latitude: row.latitude, longitude: row.longitude },
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    timeZone: row.time_zone,
    description: row.description,
    imageUrl: row.image_url ?? '',
    tags: row.tags,
    menu: menuItemRows.map(menuItemRowToMenuItem),
    orderUrl: row.order_url ?? '',
    busy: { occupancy: row.occupancy, capacity: row.capacity },
    createdAt: row.created_at,
  };
}

export function profileRowToUserProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    avatarUrl: row.avatar_url ?? '',
    avatarPath: row.avatar_path ?? '',
    homeCity: row.home_city ?? '',
    leaderboardVisible: row.leaderboard_visible,
    memberSince: row.member_since,
  };
}

export function badgeRowToBadgeDefinition(row: BadgeRow): BadgeDefinition {
  return {
    id: row.id,
    key: row.key,
    title: row.title,
    description: row.description,
  };
}

export function rewardRowToReward(row: RewardRow): Reward {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    costPoints: row.cost_points,
    discountCents: row.discount_cents,
    expiresAt: row.expires_at,
    minLevel: row.min_level ?? null,
  };
}

export function statsRowToProfileStats(row: {
  events_attended: number;
  cities_visited: number;
  challenges_completed: number;
  orders_count: number;
}): ProfileStats {
  return {
    eventsAttended: row.events_attended,
    citiesVisited: row.cities_visited,
    challengesCompleted: row.challenges_completed,
    ordersCount: row.orders_count,
  };
}
