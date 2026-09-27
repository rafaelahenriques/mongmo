import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useTheme } from '@/hooks/useTheme';

/**
 * Inline strip shown whenever the device is offline. react-query then serves
 * the persisted last-known data while this explains why it might be stale.
 */
function OfflineBannerComponent() {
  const theme = useTheme();
  const { isOffline } = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
      accessibilityRole="alert"
      accessibilityLabel="You are offline. Showing last updated data."
    >
      <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
        You&apos;re offline — showing last updated data.
      </ThemedText>
    </View>
  );
}

export default memo(OfflineBannerComponent);

const styles = StyleSheet.create({
  banner: {
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
  },
});
