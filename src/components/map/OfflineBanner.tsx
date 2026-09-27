import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Icon } from '@/components/ui/Icon';
import { Radius, Spacing } from '@/constants/theme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useTheme } from '@/hooks/useTheme';

/**
 * Pill shown whenever the device is offline. react-query then serves the
 * persisted last-known data while this explains why it might be stale.
 */
function OfflineBannerComponent() {
  const theme = useTheme();
  const { isOffline } = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <View
      style={[styles.banner, { backgroundColor: theme.primary }]}
      accessibilityRole="alert"
      accessibilityLabel="You are offline. Showing last updated data."
    >
      <Icon name="alert" size={16} color={theme.onPrimary} />
      <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
        Offline — showing last updated data
      </ThemedText>
    </View>
  );
}

export default memo(OfflineBannerComponent);

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
