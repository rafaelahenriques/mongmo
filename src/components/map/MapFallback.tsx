import { StyleSheet, View } from 'react-native';

import { MapSketch } from '@/components/map/MapSketch';
import { ThemedText } from '@/components/ThemedText';
import { PageInset } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/**
 * Where there's no live map (the web, or an Android build without a Google
 * Maps key): the design's street sketch with a note. The panel below and
 * the List view carry the same pop-ups, so nothing is lost.
 */
export function MapFallback({ route, note }: { route: boolean; note: string }) {
  const theme = useTheme();
  return (
    <View style={styles.fill}>
      <MapSketch route={route} style={styles.fill} />
      <ThemedText
        type="caption"
        themeColor="textSecondary"
        style={[styles.note, { backgroundColor: theme.background }]}
      >
        {note}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  note: {
    position: 'absolute',
    left: PageInset,
    bottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
