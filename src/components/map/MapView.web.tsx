import { forwardRef, memo } from 'react';

import { MapFallback } from '@/components/map/MapFallback';
import type { MapViewProps } from './MapView';

/** No camera to move on web; the recenter button finds nothing to call. */
export type MapHandle = { animateToRegion: (...args: unknown[]) => void };

/** Web stand-in for react-native-maps, which has no web support. */
const MapViewWeb = forwardRef<MapHandle, MapViewProps>(function MapViewWeb({ route }, _ref) {
  return <MapFallback route={Boolean(route)} note="The live map is in the iOS and Android app." />;
});

export default memo(MapViewWeb);
