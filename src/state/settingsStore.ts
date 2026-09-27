import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Appearance preference; 'system' follows the device setting. */
export type ThemeMode = 'system' | 'light' | 'dark';

type SettingsState = {
  /** Gates geofence push alerts — off means no regions are registered. */
  notificationsEnabled: boolean;
  themeMode: ThemeMode;
  setNotificationsEnabled: (enabled: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
};

const DEFAULTS = {
  notificationsEnabled: true,
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
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setThemeMode: (mode) => set({ themeMode: mode }),
    }),
    {
      name: 'mongmo-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
