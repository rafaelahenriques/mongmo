import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useActivityStore } from '@/state/activityStore';

/** Appearance preference; 'system' follows the device setting. */
export type ThemeMode = 'system' | 'light' | 'dark';

type SettingsState = {
  /** Gates geofence push alerts — off means no regions are registered. */
  notificationsEnabled: boolean;
  themeMode: ThemeMode;
  /** When off the signed-in user is left out of the leaderboard. */
  leaderboardVisible: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setLeaderboardVisible: (visible: boolean) => void;
  /** Signs out of the local session: clears activity and resets settings. */
  logOut: () => void;
};

const DEFAULTS = {
  notificationsEnabled: true,
  themeMode: 'system' as ThemeMode,
  leaderboardVisible: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setThemeMode: (mode) => set({ themeMode: mode }),
      setLeaderboardVisible: (visible) => set({ leaderboardVisible: visible }),

      logOut: () => {
        // Local session = recorded activity + preferences; the mock API has
        // no auth, so signing out clears what only this device stored.
        useActivityStore.getState().clearActivity();
        set({ ...DEFAULTS });
      },
    }),
    {
      name: 'mongmo-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notificationsEnabled: state.notificationsEnabled,
        themeMode: state.themeMode,
        leaderboardVisible: state.leaderboardVisible,
      }),
    },
  ),
);
