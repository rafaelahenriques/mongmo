import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { TextField } from '@/components/ui/TextField';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { pinnedPoint, useLocationPicker, type LocationPickerProps } from './useLocationPicker';

const PIN_DELTA = 0.006;

/**
 * iOS/Android: search an address or use where you are, then drag the pin (or
 * tap the map) to fine-tune. The raw coordinates hide behind a toggle.
 */
export function LocationPicker(props: LocationPickerProps) {
  const { value, onChange } = props;
  const theme = useTheme();
  const { busy, note, problem, search, locate, move } = useLocationPicker(props);
  const [query, setQuery] = useState('');
  const [showCoordinates, setShowCoordinates] = useState(false);
  const mapRef = useRef<MapView>(null);
  const point = pinnedPoint(value);

  // Follow the pin when it jumps (search, current location), not while dragging.
  const latitude = point?.latitude;
  const longitude = point?.longitude;
  useEffect(() => {
    if (latitude === undefined || longitude === undefined) return;
    mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: PIN_DELTA, longitudeDelta: PIN_DELTA }, 400);
  }, [latitude, longitude]);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.flex}>
          <TextField
            label="Search an address"
            value={query}
            onChangeText={setQuery}
            placeholder="e.g. Grote Markt, Kortrijk"
            returnKeyType="search"
            autoCorrect={false}
            onSubmitEditing={() => search(query)}
          />
        </View>
        <Button
          label="Find"
          size="medium"
          variant="primary"
          loading={busy === 'search'}
          disabled={!query.trim() || busy !== null}
          onPress={() => search(query)}
          accessibilityLabel="Find this address"
          style={styles.findButton}
        />
      </View>

      <Button
        label="Use my current location"
        variant="ghost"
        size="medium"
        icon="locate"
        loading={busy === 'locate'}
        disabled={busy !== null}
        onPress={locate}
      />

      {point ? (
        <View style={[styles.mapFrame, { backgroundColor: theme.backgroundSelected }]}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={{ ...point, latitudeDelta: PIN_DELTA, longitudeDelta: PIN_DELTA }}
            onPress={(event) => move(event.nativeEvent.coordinate)}
            showsCompass={false}
            accessibilityLabel="Map of the pop-up's location. Drag the pin or tap to move it."
          >
            <Marker
              coordinate={point}
              draggable
              pinColor={Colors.light.brandFill}
              onDragEnd={(event) => move(event.nativeEvent.coordinate)}
            />
          </MapView>
        </View>
      ) : null}

      {problem ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {problem}
        </ThemedText>
      ) : note ? (
        <ThemedText type="small" themeColor="success" accessibilityLiveRegion="polite">
          {note} {point ? 'Drag the pin to fine-tune.' : ''}
        </ThemedText>
      ) : null}

      <TextField label="City" value={value.city} onChangeText={(city) => onChange({ ...value, city })} />
      <TextField
        label="Venue"
        value={value.venue}
        onChangeText={(venue) => onChange({ ...value, venue })}
        placeholder="Street, square or landmark"
        hint="As guests will see it, e.g. “In front of Mongmo”."
      />

      <Pressable
        onPress={() => setShowCoordinates((shown) => !shown)}
        accessibilityRole="button"
        accessibilityState={{ expanded: showCoordinates }}
        style={styles.coordinatesToggle}
        hitSlop={8}
      >
        <Icon name="pin" size={14} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
          {point ? `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}` : 'No coordinates yet'}
        </ThemedText>
        <ThemedText type="smallBold" themeColor="primaryText">
          {showCoordinates ? 'Hide' : 'Edit coordinates'}
        </ThemedText>
      </Pressable>
      {showCoordinates ? (
        <View style={styles.row}>
          <TextField
            label="Latitude"
            value={value.latitude}
            onChangeText={(latitude) => onChange({ ...value, latitude })}
            keyboardType="numbers-and-punctuation"
            half
          />
          <TextField
            label="Longitude"
            value={value.longitude}
            onChangeText={(longitude) => onChange({ ...value, longitude })}
            keyboardType="numbers-and-punctuation"
            half
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  findButton: {
    minHeight: 50,
  },
  mapFrame: {
    height: 200,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  coordinatesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
