import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isTabBarHidden } from '@/utils/tabBar';

/**
 * Space to leave at the bottom of a screen. The word tab bar takes its own
 * space below the screens and covers the home indicator, so screens with
 * the bar need none; full-screen steps without it must clear the home
 * indicator themselves.
 */
export function useTabBarInset(): number {
  const insets = useSafeAreaInsets();
  return isTabBarHidden(usePathname()) ? insets.bottom : 0;
}
