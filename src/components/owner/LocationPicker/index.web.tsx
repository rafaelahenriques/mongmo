import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { useLocationPicker, type LocationPickerProps } from './useLocationPicker';

/**
 * Web: no map or address search in the browser build, so the coordinates
 * are always editable next to "Use my current location".
 */
export function LocationPicker(props: LocationPickerProps) {
  const { value, onChange } = props;
  const { busy, note, problem, locate } = useLocationPicker(props);

  return (
    <View style={styles.container}>
      <Button
        label="Use my current location"
        variant="primary"
        icon="locate"
        loading={busy === 'locate'}
        onPress={locate}
      />
      {problem ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {problem}
        </ThemedText>
      ) : note ? (
        <ThemedText type="small" themeColor="success" accessibilityLiveRegion="polite">
          {note}
        </ThemedText>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          Address search and the map pin are in the iOS and Android app.
        </ThemedText>
      )}
      <TextField label="City" value={value.city} onChangeText={(city) => onChange({ ...value, city })} />
      <TextField
        label="Venue"
        value={value.venue}
        onChangeText={(venue) => onChange({ ...value, venue })}
        placeholder="Street, square or landmark"
      />
      <View style={styles.row}>
        <TextField
          label="Latitude"
          value={value.latitude}
          onChangeText={(latitude) => onChange({ ...value, latitude })}
          half
        />
        <TextField
          label="Longitude"
          value={value.longitude}
          onChangeText={(longitude) => onChange({ ...value, longitude })}
          half
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
