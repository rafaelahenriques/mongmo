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
};

type SettingsState = {
  notifications: NotificationPrefs;
  themeMode: ThemeMode;
  setNotificationPref: (key: keyof NotificationPrefs, enabled: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
};

const DEFAULTS = {
  notifications: {
    nearby: true,
    orderUpdates: true,
    rewardExpiring: true,
    achievements: true,
  } satisfies NotificationPrefs,
  themeMode: 'system' as ThemeMode,
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
    }),
    {
      name: 'mongmo-settings',
      storage: createJSONStorage(() => AsyncStorage),
      // v1 stored a single `notificationsEnabled` boolean; v2 split it into
      // per-type toggles, seeded from the old value so existing installs
      // keep their choice instead of silently reverting to the defaults.
      // v3 added `achievements` (on by default).
      version: 3,
      migrate: (persisted, version) => {
        if (!persisted || typeof persisted !== 'object') return persisted as SettingsState;
        let state = persisted as Partial<SettingsState> & { notificationsEnabled?: boolean };
        if (version < 2) {
          const enabled = state.notificationsEnabled ?? true;
          state = {
            themeMode: state.themeMode ?? DEFAULTS.themeMode,
            notifications: { nearby: enabled, orderUpdates: enabled, rewardExpiring: enabled, achievements: true },
          };
        }
        if (version < 3 && state.notifications) {
          state = { ...state, notifications: { ...state.notifications, achievements: true } };
        }
        return state as SettingsState;
      },
    },
  ),
);
