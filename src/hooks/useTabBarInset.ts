import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';

/**
 * Space the native tab bar (plus the home indicator) takes at the bottom,
 * for anything that must stay above the tabs. This is the SDK 57 template's
 * own pattern: inside a stack nested in native tabs, the safe-area bottom
 * only covers the home indicator, not the tab bar, so BottomTabInset is
 * added explicitly. 0 on web, where the tabs sit at the top.
 */
export function useTabBarInset(): number {
  return useSafeAreaInsets().bottom + BottomTabInset;
}
