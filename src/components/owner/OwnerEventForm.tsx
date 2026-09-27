import { useState } from 'react';
import { StyleSheet, View, type KeyboardTypeOptions } from 'react-native';

import type { OwnerEventInput } from '@/api/owner';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import type { IconName } from '@/components/ui/Icon';
import { OptionPill } from '@/components/ui/OptionPill';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { haptics } from '@/services/haptics';
import { getCurrentPlace } from '@/services/location';
import { formatEventWindow } from '@/utils/dateTime';

export type OwnerEventFormProps = {
  initial?: Partial<OwnerEventInput>;
  submitLabel: string;
  pending: boolean;
  /** Why the last save failed (from the server), shown next to the button. */
  submitError?: string | null;
  onSubmit: (input: OwnerEventInput) => void;
};

const TYPE_OPTIONS = [
  { value: 'food-truck', label: 'Food truck' },
  { value: 'city-pop-up', label: 'City pop-up' },
  { value: 'bar-takeover', label: 'Bar takeover' },
];

const START_PRESETS = [
  { label: 'Now', start: () => roundDown(new Date()) },
  { label: 'In 1 hour', start: () => roundDown(new Date(Date.now() + 60 * 60_000)) },
  {
    label: 'Tomorrow 12:00',
    start: () => {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      date.setHours(12, 0, 0, 0);
      return date;
    },
  },
];

const DURATION_PRESETS = [2, 4, 6];
const DEFAULT_DURATION_HOURS = 6;

/** Down to the previous 5 minutes, so "now" reads as a clean time. */
function roundDown(date: Date): Date {
  const rounded = new Date(date);
  rounded.setMinutes(rounded.getMinutes() - (rounded.getMinutes() % 5), 0, 0);
  return rounded;
}

function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 60 * 60_000).toISOString();
}

/**
 * Create/edit form for a pop-up, in three parts:
 *  - Basics: name, kind, capacity, description.
 *  - Where: "Use my current location" fills the coordinates (and city and
 *    street, if still empty); everything stays editable for planning a
 *    pop-up somewhere else.
 *  - When: quick start/duration presets; new pop-ups default to now → +6 h.
 */
export default function OwnerEventForm({
  initial,
  submitLabel,
  pending,
  submitError,
  onSubmit,
}: OwnerEventFormProps) {
  const [defaultStart] = useState(() => roundDown(new Date()).toISOString());

  const [title, setTitle] = useState(initial?.title ?? '');
  const [type, setType] = useState(initial?.type ?? 'food-truck');
  const [city, setCity] = useState(initial?.city ?? '');
  const [venue, setVenue] = useState(initial?.venue ?? '');
  const [latitude, setLatitude] = useState(initial?.latitude?.toString() ?? '');
  const [longitude, setLongitude] = useState(initial?.longitude?.toString() ?? '');
  const [startsAt, setStartsAt] = useState(initial?.startsAt ?? defaultStart);
  const [endsAt, setEndsAt] = useState(initial?.endsAt ?? addHours(defaultStart, DEFAULT_DURATION_HOURS));
  const [timeZone] = useState(initial?.timeZone ?? 'Europe/Brussels');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [capacity, setCapacity] = useState(initial?.capacity?.toString() ?? '50');
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);

  const typeOptions = TYPE_OPTIONS.some((option) => option.value === type)
    ? TYPE_OPTIONS
    : [...TYPE_OPTIONS, { value: type, label: type }];
  const timesValid = !Number.isNaN(Date.parse(startsAt)) && !Number.isNaN(Date.parse(endsAt));
  const durationHours = timesValid ? (Date.parse(endsAt) - Date.parse(startsAt)) / 3_600_000 : null;

  const field = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    options?: {
      keyboardType?: KeyboardTypeOptions;
      multiline?: boolean;
      hint?: string;
      placeholder?: string;
      /** Share a row with another half-width field. */
      half?: boolean;
    },
  ) => (
    <TextField
      label={label}
      value={value}
      onChangeText={onChangeText}
      keyboardType={options?.keyboardType ?? 'default'}
      multiline={options?.multiline}
      placeholder={options?.placeholder}
      hint={options?.hint}
      half={options?.half}
    />
  );

  const onUseCurrentLocation = async () => {
    setError(null);
    setLocationNote(null);
    setLocating(true);
    try {
      const place = await getCurrentPlace();
      setLatitude(place.latitude.toFixed(6));
      setLongitude(place.longitude.toFixed(6));
      // Suggest a city/venue, but never overwrite what's already typed.
      if (!city.trim() && place.city) setCity(place.city);
      if (!venue.trim() && place.street) setVenue(place.street);
      setLocationNote(
        `Pinned to where you are${place.accuracy ? ` (±${Math.round(place.accuracy)} m)` : ''}.`,
      );
      haptics.success();
    } catch (locationError) {
      haptics.error();
      setError(locationError instanceof Error ? locationError.message : 'Couldn’t get your location.');
    } finally {
      setLocating(false);
    }
  };

  const onPickStart = (start: Date) => {
    const duration = durationHours && durationHours > 0 ? durationHours : DEFAULT_DURATION_HOURS;
    const iso = start.toISOString();
    setStartsAt(iso);
    setEndsAt(addHours(iso, duration));
  };

  const onPressSubmit = () => {
    setError(null);
    const lat = Number(latitude);
    const lng = Number(longitude);
    const cap = Number(capacity);
    const fail = (message: string) => {
      haptics.error();
      setError(message);
    };
    if (!title.trim() || !city.trim() || !venue.trim()) {
      fail('Name, city and venue are required.');
      return;
    }
    if (!latitude.trim() || !longitude.trim() || Number.isNaN(lat) || Number.isNaN(lng)) {
      fail('Set the location — tap "Use my current location" or type the coordinates.');
      return;
    }
    if (!timesValid) {
      fail('Start and end must be ISO timestamps, e.g. 2026-10-01T17:00:00+02:00.');
      return;
    }
    if (Date.parse(endsAt) <= Date.parse(startsAt)) {
      fail('The end has to be after the start.');
      return;
    }
    if (Number.isNaN(cap) || cap <= 0) {
      fail('Capacity must be a positive number.');
      return;
    }
    onSubmit({
      title: title.trim(),
      type,
      city: city.trim(),
      venue: venue.trim(),
      latitude: lat,
      longitude: lng,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      timeZone,
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      capacity: cap,
    });
  };

  return (
    <View style={styles.form}>
      <Card style={styles.group}>
        <GroupTitle icon="sparkles" title="Basics" />
        {field('Name', title, setTitle, { placeholder: 'e.g. Bánh mì on the Grote Markt' })}
        <View style={styles.field}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Kind
          </ThemedText>
          <View style={styles.pills} accessibilityRole="radiogroup" accessibilityLabel="Kind of pop-up">
            {typeOptions.map((option) => (
              <OptionPill
                key={option.value}
                label={option.label}
                checked={type === option.value}
                onPress={() => setType(option.value)}
              />
            ))}
          </View>
        </View>
        {field('Capacity', capacity, setCapacity, { keyboardType: 'number-pad' })}
        {field('Description', description, setDescription, { multiline: true })}
      </Card>

      <Card style={styles.group}>
        <GroupTitle icon="pin" title="Where" />
        <Button
          label="Use my current location"
          variant="primary"
          icon="locate"
          onPress={onUseCurrentLocation}
          loading={locating}
        />
        {locationNote ? (
          <ThemedText type="small" themeColor="success" accessibilityLiveRegion="polite">
            {locationNote}
          </ThemedText>
        ) : null}
        {field('City', city, setCity)}
        {field('Venue', venue, setVenue, { placeholder: 'Street, square or landmark' })}
        <View style={styles.row}>
          {field('Latitude', latitude, setLatitude, { keyboardType: 'numbers-and-punctuation', half: true })}
          {field('Longitude', longitude, setLongitude, { keyboardType: 'numbers-and-punctuation', half: true })}
        </View>
      </Card>

      <Card style={styles.group}>
        <GroupTitle icon="calendar" title="When" />
        {timesValid ? (
          <ThemedText type="smallBold" themeColor="primaryText">
            {formatEventWindow(startsAt, endsAt, timeZone)}
          </ThemedText>
        ) : null}
        <View style={styles.field}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Starts
          </ThemedText>
          <View style={styles.pills}>
            {START_PRESETS.map((preset) => (
              <OptionPill key={preset.label} label={preset.label} onPress={() => onPickStart(preset.start())} />
            ))}
          </View>
        </View>
        <View style={styles.field}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Runs for
          </ThemedText>
          <View style={styles.pills} accessibilityRole="radiogroup" accessibilityLabel="Duration">
            {DURATION_PRESETS.map((hours) => (
              <OptionPill
                key={hours}
                label={`${hours} h`}
                checked={durationHours === hours}
                onPress={() => timesValid && setEndsAt(addHours(startsAt, hours))}
              />
            ))}
          </View>
        </View>
        {field('Start time (ISO)', startsAt, setStartsAt, { hint: 'Fine-tune if needed, e.g. 2026-10-01T17:00:00+02:00' })}
        {field('End time (ISO)', endsAt, setEndsAt)}
      </Card>

      <Card style={styles.group}>
        <GroupTitle icon="photo" title="Look" />
        {field('Hero image URL', imageUrl, setImageUrl, { placeholder: 'https://… (optional)' })}
      </Card>

      {error ?? submitError ? (
        <ThemedText type="smallBold" themeColor="danger" accessibilityRole="alert">
          {error ?? submitError}
        </ThemedText>
      ) : null}

      <Button label={submitLabel} variant="brand" haptic="press" onPress={onPressSubmit} loading={pending} />
    </View>
  );
}

function GroupTitle({ icon, title }: { icon: IconName; title: string }) {
  return (
    <View style={styles.groupTitle}>
      <IconBadge name={icon} size={32} />
      <ThemedText type="section" accessibilityRole="header">
        {title}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.three,
  },
  group: {
    gap: Spacing.three,
  },
  groupTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  field: {
    gap: Spacing.one + 2,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
