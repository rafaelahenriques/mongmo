import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { OwnerEventInput } from '@/api/owner';

export type OwnerEventFormProps = {
  initial?: Partial<OwnerEventInput>;
  submitLabel: string;
  pending: boolean;
  onSubmit: (input: OwnerEventInput) => void;
};

/**
 * Plain-text event form — no map picker or native date UI, per AGENTS.md's
 * "don't over-build": the owner types coordinates and ISO timestamps
 * directly. Shared between create and edit.
 */
export default function OwnerEventForm({ initial, submitLabel, pending, onSubmit }: OwnerEventFormProps) {
  const theme = useTheme();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [type, setType] = useState(initial?.type ?? 'food-truck');
  const [city, setCity] = useState(initial?.city ?? '');
  const [venue, setVenue] = useState(initial?.venue ?? '');
  const [latitude, setLatitude] = useState(initial?.latitude?.toString() ?? '');
  const [longitude, setLongitude] = useState(initial?.longitude?.toString() ?? '');
  const [startsAt, setStartsAt] = useState(initial?.startsAt ?? '');
  const [endsAt, setEndsAt] = useState(initial?.endsAt ?? '');
  const [timeZone] = useState(initial?.timeZone ?? 'Europe/Brussels');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [capacity, setCapacity] = useState(initial?.capacity?.toString() ?? '50');
  const [error, setError] = useState<string | null>(null);

  const field = (label: string, value: string, onChangeText: (text: string) => void, options?: { keyboardType?: 'numeric' | 'default'; multiline?: boolean }) => (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={options?.keyboardType ?? 'default'}
        multiline={options?.multiline}
        style={[
          styles.input,
          options?.multiline && styles.multiline,
          { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
        ]}
      />
    </View>
  );

  const onPressSubmit = () => {
    setError(null);
    const lat = Number(latitude);
    const lng = Number(longitude);
    const cap = Number(capacity);

    if (!title.trim() || !city.trim() || !venue.trim()) {
      setError('Title, city and venue are required.');
      return;
    }
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError('Latitude and longitude must be numbers.');
      return;
    }
    if (Number.isNaN(Date.parse(startsAt)) || Number.isNaN(Date.parse(endsAt))) {
      setError('Start and end must be ISO timestamps, e.g. 2026-10-01T17:00:00+02:00.');
      return;
    }
    if (Number.isNaN(cap) || cap <= 0) {
      setError('Capacity must be a positive number.');
      return;
    }

    onSubmit({
      title: title.trim(),
      type: type.trim() || 'food-truck',
      city: city.trim(),
      venue: venue.trim(),
      latitude: lat,
      longitude: lng,
      startsAt,
      endsAt,
      timeZone,
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      capacity: cap,
    });
  };

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {field('Title', title, setTitle)}
      {field('Type (e.g. food-truck, bar-takeover, city-pop-up)', type, setType)}
      {field('City', city, setCity)}
      {field('Venue', venue, setVenue)}
      {field('Latitude', latitude, setLatitude, { keyboardType: 'numeric' })}
      {field('Longitude', longitude, setLongitude, { keyboardType: 'numeric' })}
      {field('Starts at (ISO 8601)', startsAt, setStartsAt)}
      {field('Ends at (ISO 8601)', endsAt, setEndsAt)}
      {field('Capacity', capacity, setCapacity, { keyboardType: 'numeric' })}
      {field('Hero image URL', imageUrl, setImageUrl)}
      {field('Description', description, setDescription, { multiline: true })}

      {error ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {error}
        </ThemedText>
      ) : null}

      <Pressable
        onPress={onPressSubmit}
        disabled={pending}
        accessibilityRole="button"
        accessibilityLabel={submitLabel}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: '#8B4513', opacity: pending ? 0.7 : pressed ? 0.9 : 1 },
        ]}
      >
        {pending ? <ActivityIndicator color="#FFFFFF" /> : (
          <ThemedText type="smallBold" style={styles.buttonText}>
            {submitLabel}
          </ThemedText>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  field: {
    gap: Spacing.half,
  },
  input: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
  },
  multiline: {
    minHeight: 80,
    paddingTop: Spacing.two,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: Spacing.three,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
  },
});
