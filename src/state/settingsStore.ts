import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Appearance preference; 'system' follows the device setting. */
export type ThemeMode = 'system' | 'light' | 'dark';

/** Opt-in, per-type push notification toggles (AGENTS.md). */
export type NotificationPrefs = {
  /** Nearby pop-up geofence alerts. */
  nearby: boolean;
  /** Order confirmed/preparing/ready pushes. */
  orderUpdates: boolean;
  /** A redeemed reward is about to expire. */
  rewardExpiring: boolean;
  /** A badge was just unlocked. */
  achievements: boolean;
  /** Something left in the cart. */
  cartReminder: boolean;
};

type SettingsState = {
  notifications: NotificationPrefs;
  themeMode: ThemeMode;
  /** When the Notifications list was last opened, for Home's "3 new". */
  notificationsSeenAt: string | null;
  /** The photo-first Opening screen shows on the very first launch only. */
  openingSeen: boolean;
  /** The location and notification switches were offered after sign-in. */
  permissionsAsked: boolean;
  /** The level whose "Welcome to …" banner Home last showed (a level key). */
  levelSeen: string | null;
  setNotificationPref: (key: keyof NotificationPrefs, enabled: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  markNotificationsSeen: () => void;
  markOpeningSeen: () => void;
  markPermissionsAsked: () => void;
  markLevelSeen: (key: string) => void;
};

const DEFAULTS = {
  notifications: {
    nearby: true,
    orderUpdates: true,
    rewardExpiring: true,
    achievements: true,
    cartReminder: true,
  } satisfies NotificationPrefs,
  themeMode: 'system' as ThemeMode,
  notificationsSeenAt: null as string | null,
  openingSeen: false,
  permissionsAsked: false,
  levelSeen: null as string | null,
};

/**
 * Device-only preferences. Leaderboard visibility lives on `profiles`
 * instead (it's server data other users' queries depend on) — see
 * useProfile's `setLeaderboardVisible` mutation.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setNotificationPref: (key, enabled) =>
        set((state) => ({ notifications: { ...state.notifications, [key]: enabled } })),
      setThemeMode: (mode) => set({ themeMode: mode }),
      markNotificationsSeen: () => set({ notificationsSeenAt: new Date().toISOString() }),
      markOpeningSeen: () => set({ openingSeen: true }),
      markPermissionsAsked: () => set({ permissionsAsked: true }),
      markLevelSeen: (key) => set({ levelSeen: key }),
    }),
    {
      name: 'mongmo-settings',
      storage: createJSONStorage(() => AsyncStorage),
      // v1 stored a single `notificationsEnabled` boolean; v2 split it into
      // per-type toggles, seeded from the old value so existing installs
      // keep their choice instead of silently reverting to the defaults.
      // v3 added `achievements`, v4 `cartReminder` (both on by default).
      version: 4,
      migrate: (persisted, version) => {
        if (!persisted || typeof persisted !== 'object') return persisted as SettingsState;
        let state = persisted as Partial<SettingsState> & { notificationsEnabled?: boolean };
        if (version < 2) {
          const enabled = state.notificationsEnabled ?? true;
          state = {
            themeMode: state.themeMode ?? DEFAULTS.themeMode,
            notifications: {
              nearby: enabled,
              orderUpdates: enabled,
              rewardExpiring: enabled,
              achievements: true,
              cartReminder: true,
            },
          };
        }
        if (version < 3 && state.notifications) {
          state = { ...state, notifications: { ...state.notifications, achievements: true } };
        }
        if (version < 4 && state.notifications) {
          state = { ...state, notifications: { ...state.notifications, cartReminder: true } };
        }
        return state as SettingsState;
      },
    },
  ),
);
