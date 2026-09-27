import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';

/**
 * Bottom action bar ("View cart", "Continue", …) for screens inside the
 * tabs. Render it after the screen's ScrollView, never absolutely
 * positioned. Its bottom padding clears the native tab bar and the home
 * indicator, so the action always sits above the tabs.
 */
export function ScreenFooter({ children }: PropsWithChildren) {
  const theme = useTheme();
  const tabBarInset = useTabBarInset();

  return (
    <View
      style={[
        styles.footer,
        {
          backgroundColor: theme.background,
          boxShadow: `0px -10px 24px ${theme.shadow}`,
          paddingBottom: tabBarInset + Spacing.two,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
});
