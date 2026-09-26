import { MOCK_SCENARIO } from '@/constants/config';
import type {
  BadgeDefinition,
  LeaderboardEntry,
  PopUpEvent,
  Reward,
  Store,
  UserProfile,
  WeeklyHours,
} from '@/types';

/**
 * Mock data backing the API transport, modeled on the real Mongmo site
 * (mongmo-store.com) and its published event calendar. Swapping in a real
 * server only requires EXPO_PUBLIC_API_URL — none of the app reads this file.
 */

const TIME_ZONE = 'Europe/Brussels';

const MOCK_HOURS: WeeklyHours = {
  mon: null,
  tue: null,
  wed: null,
  thu: { open: '10:00', close: '18:00' },
  fri: { open: '10:00', close: '18:00' },
  sat: { open: '10:00', close: '18:00' },
  sun: { open: '10:00', close: '16:00' },
};

export const MOCK_STORE: Store = {
  type: 'store',
  id: 'mongmo-kortrijk',
  name: 'Mongmo',
  address: 'Jan Palfijnstraat 26, 8500 Kortrijk',
  coordinates: { latitude: 50.8289, longitude: 3.2664 },
  timeZone: TIME_ZONE,
  hours: MOCK_HOURS,
  amenities: ['Fresh bakery daily', 'Pickup & delivery', 'Card payment', 'Vegetarian friendly'],
  busy: { occupancy: 11, capacity: 40 },
  phone: '+32 56 94 43 81',
  orderUrl: 'https://bestel.mongmo-store.com/nl',
};

const MENU_PREVIEW = [
  {
    id: 'banh-mi',
    name: 'Bánh mì',
    description: 'Grilled pork, pickled vegetables & coriander',
    price: '€6.50',
  },
  {
    id: 'cha-gio',
    name: 'Chả giò',
    description: 'Crispy spring rolls, 4 pieces',
    price: '€5.00',
  },
  {
    id: 'ca-phe',
    name: 'Cà phê sữa đá',
    description: 'Iced coffee with condensed milk',
    price: '€3.50',
  },
  {
    id: 'banh-flan',
    name: 'Bánh flan',
    description: 'Coconut crème caramel',
    price: '€4.00',
  },
];

export const MOCK_EVENTS: PopUpEvent[] = [
  {
    type: 'event',
    id: 'bar-amorse-2026-09-25',
    title: 'Bar Amorse × Mongmo',
    city: 'Kortrijk',
    venue: 'In front of Mongmo, Jan Palfijnstraat 26',
    coordinates: { latitude: 50.83, longitude: 3.2685 },
    startsAt: '2026-09-25T17:00:00+02:00',
    endsAt: '2026-09-25T23:00:00+02:00',
    timeZone: TIME_ZONE,
    description:
      'Bar Amorse takes over the street in front of Mongmo for an evening of natural wine, records and Vietnamese bar snacks.',
    imageUrl:
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
    tags: ['Food & drinks', 'Music'],
    menu: MENU_PREVIEW,
    orderUrl: 'https://bestel.mongmo-store.com/nl',
    busy: { occupancy: 18, capacity: 80 },
  },
  {
    type: 'event',
    id: 'moonfest-2026-09-26',
    title: 'Moonfest Chinatown Antwerpen',
    city: 'Antwerpen',
    venue: 'Van Wesenbekestraat, Chinatown',
    coordinates: { latitude: 51.2178, longitude: 4.4175 },
    startsAt: '2026-09-26T12:00:00+02:00',
    endsAt: '2026-09-26T22:00:00+02:00',
    timeZone: TIME_ZONE,
    description:
      'Moonfest lights up Antwerp’s Chinatown with lanterns, street food and live performances — Mongmo brings a full bakery stand.',
    imageUrl:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    tags: ['Festival', 'Street food'],
    menu: MENU_PREVIEW,
    orderUrl: 'https://bestel.mongmo-store.com/nl',
    busy: { occupancy: 140, capacity: 400 },
  },
  {
    type: 'event',
    id: 'bar-amorse-2026-09-27',
    title: 'Bar Amorse × Mongmo',
    city: 'Kortrijk',
    venue: 'In front of Mongmo, Jan Palfijnstraat 26',
    coordinates: { latitude: 50.8279, longitude: 3.2649 },
    startsAt: '2026-09-27T12:00:00+02:00',
    endsAt: '2026-09-27T18:00:00+02:00',
    timeZone: TIME_ZONE,
    description:
      'A Sunday wrap-up session with Bar Amorse: brunch plates, coffee from the bakery and slow records on the street.',
    imageUrl:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    tags: ['Food & drinks', 'Music'],
    menu: MENU_PREVIEW,
    orderUrl: 'https://bestel.mongmo-store.com/nl',
    busy: { occupancy: 9, capacity: 80 },
  },
];

/** Scenario-driven store (see MOCK_SCENARIO in constants/config). */
export function getMockStore(): Store {
  if (MOCK_SCENARIO === 'closed') {
    // Closed all week except Monday so "next opening" stays demonstrable.
    return {
      ...MOCK_STORE,
      hours: {
        mon: { open: '10:00', close: '18:00' },
        tue: null,
        wed: null,
        thu: null,
        fri: null,
        sat: null,
        sun: null,
      },
    };
  }
  return MOCK_STORE;
}

/** Scenario-driven events (see MOCK_SCENARIO in constants/config). */
export function getMockEvents(): PopUpEvent[] {
  if (MOCK_SCENARIO === 'empty') {
    return [];
  }
  if (MOCK_SCENARIO === 'full') {
    // Fill every event (not just the first): which one is displayed depends
    // on the current date, and past events never reach the UI anyway.
    return MOCK_EVENTS.map((event) => ({
      ...event,
      busy: { ...event.busy, occupancy: event.busy.capacity },
    }));
  }
  return MOCK_EVENTS;
}

/* ------------------------------------------------------------------ *
 * Profile / achievements / leaderboard mock content.                  *
 * ------------------------------------------------------------------ */

export const MOCK_PROFILE: UserProfile = {
  id: 'user-me',
  name: 'Rafaela H.',
  bio: 'Design student in Kortrijk — always hunting the next pop-up 🧋',
  avatarUrl:
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  homeCity: 'Kortrijk',
  memberSince: '2026-01-12',
};

/** Badge catalog; conditions are evaluated client-side in utils/achievements. */
export const MOCK_BADGES: BadgeDefinition[] = [
  {
    id: 'first-check-in',
    title: 'First steps',
    description: 'Check in to your first pop-up',
    emoji: '🎯',
  },
  {
    id: 'streak-5',
    title: 'Five-day streak',
    description: 'Visit 5 days in a row 🔥',
    emoji: '🔥',
  },
  {
    id: 'ten-events',
    title: 'Regular',
    description: 'Attend 10 pop-ups',
    emoji: '🎫',
  },
  {
    id: 'two-cities',
    title: 'City hopper',
    description: 'Check in in 2 different cities',
    emoji: '🏙️',
  },
  {
    id: 'night-owl',
    title: 'Night owl',
    description: 'Check in after 21:00',
    emoji: '🦉',
  },
  {
    id: 'word-of-mouth',
    title: 'Word of mouth',
    description: 'Share an event with a friend',
    emoji: '📣',
  },
];

export const MOCK_REWARDS: Reward[] = [
  {
    id: 'sticker-pack',
    title: 'Mongmo sticker pack',
    description: 'Limited pop-up artwork, 4 pieces',
    costPoints: 100,
  },
  {
    id: 'discount-10',
    title: '10% off your next order',
    description: 'Pickup or delivery, one time use',
    costPoints: 150,
  },
  {
    id: 'free-coffee',
    title: 'Free cà phê sữa đá',
    description: 'Any size, on us',
    costPoints: 200,
  },
  {
    id: 'free-banh-mi',
    title: 'Free bánh mì',
    description: 'Grilled pork or tofu, your pick',
    costPoints: 350,
  },
];

/** Other members' scores; the signed-in user's row is merged in client-side. */
export const MOCK_LEADERBOARD_ROWS: LeaderboardEntry[] = [
  { userId: 'peer-minh', name: 'Minh Trần', points: 4120 },
  { userId: 'peer-linh', name: 'Linh Pham', points: 3250 },
  { userId: 'peer-jasper', name: 'Jasper V.', points: 2980 },
  { userId: 'peer-sofie', name: 'Sofie D.', points: 1870 },
  { userId: 'peer-bao', name: 'Bao Lê', points: 1560 },
  { userId: 'peer-emma', name: 'Emma W.', points: 940 },
  { userId: 'peer-thao', name: 'Thao Phan', points: 520 },
];

/** Weekly window of {@link MOCK_LEADERBOARD_ROWS} for period=weekly. */
export const MOCK_LEADERBOARD_WEEKLY: LeaderboardEntry[] = [
  { userId: 'peer-linh', name: 'Linh Pham', points: 420 },
  { userId: 'peer-jasper', name: 'Jasper V.', points: 385 },
  { userId: 'peer-minh', name: 'Minh Trần', points: 340 },
  { userId: 'peer-sofie', name: 'Sofie D.', points: 265 },
  { userId: 'peer-bao', name: 'Bao Lê', points: 190 },
  { userId: 'peer-emma', name: 'Emma W.', points: 120 },
  { userId: 'peer-thao', name: 'Thao Phan', points: 60 },
];
