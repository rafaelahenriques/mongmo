import { forwardRef, memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { MapSketch } from '@/components/map/MapSketch';
import { ThemedText } from '@/components/ThemedText';
import { PageInset } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { MapViewProps } from './MapView';

/** No camera to move on web; the recenter button finds nothing to call. */
export type MapHandle = { animateToRegion: (...args: unknown[]) => void };

/**
 * Web stand-in for react-native-maps (which has no web support): the
 * design's street sketch with a note. The panel below and the List view
 * carry the same pop-ups, so nothing is lost.
 */
const MapViewWeb = forwardRef<MapHandle, MapViewProps>(function MapViewWeb({ route }, _ref) {
  const theme = useTheme();
  return (
    <View style={styles.fill}>
      <MapSketch route={Boolean(route)} style={styles.fill} />
      <ThemedText
        type="caption"
        themeColor="textSecondary"
        style={[styles.note, { backgroundColor: theme.background }]}
      >
        The live map is in the iOS and Android app.
      </ThemedText>
    </View>
  );
});

export default memo(MapViewWeb);

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
