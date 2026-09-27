import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-screens/experimental';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/**
 * Bottom action bar ("View cart", "Continue", …) for screens inside the tabs.
 * Render it after the screen's ScrollView, never absolutely positioned: on
 * iOS only the first scroll view in a native-tabs screen gets automatic
 * insets for the tab bar, so anything else pinned to the bottom ends up
 * behind it. This safe-area edge includes the tab bar and home indicator.
 */
export function ScreenFooter({ children }: PropsWithChildren) {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={{ bottom: true }}
      style={[styles.footer, { backgroundColor: theme.background, borderColor: theme.border }]}
    >
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  footer: {
    // Size to content. SafeAreaView defaults to `flex: 1`; spelled out in
    // full because `flex: 0` collapses to a zero flex-basis on web.
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
