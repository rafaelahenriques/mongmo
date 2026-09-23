import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { MapViewProps } from '@/components/MapView';

/**
 * Web fallback for the map. react-native-maps has no web support, so we
 * render a themed placeholder instead. Metro resolves this file before
 * MapView.tsx on the web platform.
 */
export default function MapViewComponent({ popupLocations }: MapViewProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ThemedText type="subtitle" style={styles.title}>
        Map view
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
        The map is available on the iOS and Android apps.{' '}
        {popupLocations.length} pop-ups are on the hunt.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
});
