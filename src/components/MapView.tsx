import * as Location from "expo-location";
import { memo, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import MapViewLib, { Marker } from "react-native-maps";

import { MAP_DELTA, MAP_LOAD_DELAY_MS } from "@/constants/mock-data";
import { useTheme } from "@/hooks/use-theme";
import type { Location as MapLocation, Region } from "@/types";

const CAFE_PIN_COLOR = "#8B4513";
const POPUP_PIN_COLOR = "#FF6B6B";

export type MapViewProps = {
  cafeLoc: MapLocation;
  popupLocations: MapLocation[];
};

/**
 * Full-screen map showing the café and all pop-up locations.
 * Memoized so it only re-renders when its data actually changes.
 */
function MapViewComponent({ cafeLoc, popupLocations }: MapViewProps) {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  const pins = useMemo(
    () => [cafeLoc, ...popupLocations],
    [cafeLoc, popupLocations],
  );

  // Center the initial camera on all markers (café + pop-ups),
  // with a fixed delta showing a ~10km radius.
  const initialRegion = useMemo<Region>(() => {
    const latitude =
      pins.reduce((sum, pin) => sum + pin.latitude, 0) / pins.length;
    const longitude =
      pins.reduce((sum, pin) => sum + pin.longitude, 0) / pins.length;
    return {
      latitude,
      longitude,
      latitudeDelta: MAP_DELTA,
      longitudeDelta: MAP_DELTA,
    };
  }, [pins]);

  useEffect(() => {
    // Mocked initialization delay for UX purposes (~800ms).
    const timer = setTimeout(() => setIsLoading(false), MAP_LOAD_DELAY_MS);

    // Day 3 setup: request foreground permission now so real-time geofencing
    // alerts (user < 500m from a pop-up) can be wired up later.
    Location.requestForegroundPermissionsAsync().catch(() => {
      // Permission denial does not block the map itself.
    });

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme.text}
          testID="map-loading"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapViewLib style={styles.map} initialRegion={initialRegion}>
        <Marker
          coordinate={cafeLoc}
          title={cafeLoc.title}
          description={cafeLoc.description}
          pinColor={CAFE_PIN_COLOR}
        />
        {popupLocations.map((pin, index) => (
          <Marker
            key={`popup-${index}`}
            coordinate={pin}
            title={pin.title}
            description={pin.description}
            pinColor={POPUP_PIN_COLOR}
          />
        ))}
      </MapViewLib>
    </View>
  );
}

export default memo(MapViewComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    flex: 1,
  },
});
