import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { OwnerEventInput } from '@/api/owner';
import { EventImagePicker } from '@/components/owner/EventImagePicker';
import { LocationPicker } from '@/components/owner/LocationPicker';
import { pinnedPoint, type LocationValue } from '@/components/owner/LocationPicker/useLocationPicker';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DateTimeField } from '@/components/ui/DateTimeField';
import { IconBadge } from '@/components/ui/IconBadge';
import type { IconName } from '@/components/ui/Icon';
import { OptionPill } from '@/components/ui/OptionPill';
import { Stepper } from '@/components/ui/Stepper';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { haptics } from '@/services/haptics';
import { formatEventWindow, fromWallClock, toWallClock } from '@/utils/dateTime';

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

const DEFAULT_TIME_ZONE = 'Europe/Brussels';
const HOUR = 60 * 60_000;
const DURATION_PRESETS = [2, 4, 6];
const DEFAULT_DURATION_HOURS = 6;
const CAPACITY = { min: 10, max: 1000, step: 10 };

/** Down to the previous 5 minutes, so "now" reads as a clean time. */
function roundDown(date: Date): Date {
  const rounded = new Date(date);
  rounded.setMinutes(rounded.getMinutes() - (rounded.getMinutes() % 5), 0, 0);
  return rounded;
}

/** Tomorrow at noon on the pop-up's own clock. */
function tomorrowNoon(timeZone: string): Date {
  const wallClock = toWallClock(new Date(), timeZone);
  wallClock.setDate(wallClock.getDate() + 1);
  wallClock.setHours(12, 0, 0, 0);
  return fromWallClock(wallClock, timeZone);
}

const START_PRESETS: { label: string; start: (timeZone: string) => Date }[] = [
  { label: 'Now', start: () => roundDown(new Date()) },
  { label: 'In 1 hour', start: () => roundDown(new Date(Date.now() + HOUR)) },
  { label: 'Tomorrow 12:00', start: tomorrowNoon },
];

/**
 * Create/edit form for a pop-up:
 *  - Basics: name, kind, capacity, description.
 *  - Photo: picked or taken, uploaded straight away.
 *  - Where: search an address, use where you are, or drag the pin.
 *  - When: native date and time pickers plus quick presets; a new pop-up
 *    runs from now for 6 h. Times are the pop-up's own zone.
 */
export default function OwnerEventForm({ initial, submitLabel, pending, submitError, onSubmit }: OwnerEventFormProps) {
  const timeZone = initial?.timeZone ?? DEFAULT_TIME_ZONE;
  const [defaultStart] = useState(() => roundDown(new Date()));

  const [title, setTitle] = useState(initial?.title ?? '');
  const [type, setType] = useState(initial?.type ?? 'food-truck');
  const [capacity, setCapacity] = useState(initial?.capacity ?? 50);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [location, setLocation] = useState<LocationValue>({
    latitude: initial?.latitude?.toString() ?? '',
    longitude: initial?.longitude?.toString() ?? '',
    city: initial?.city ?? '',
    venue: initial?.venue ?? '',
  });
  const [startsAt, setStartsAt] = useState(() => (initial?.startsAt ? new Date(initial.startsAt) : defaultStart));
  const [endsAt, setEndsAt] = useState(() =>
    initial?.endsAt ? new Date(initial.endsAt) : new Date(defaultStart.getTime() + DEFAULT_DURATION_HOURS * HOUR),
  );
  const [error, setError] = useState<string | null>(null);

  const typeOptions = TYPE_OPTIONS.some((option) => option.value === type)
    ? TYPE_OPTIONS
    : [...TYPE_OPTIONS, { value: type, label: type }];
  const durationMs = endsAt.getTime() - startsAt.getTime();
  const durationHours = durationMs / HOUR;

  /** Moving the start keeps the length, like a calendar does. */
  const onChangeStart = (start: Date) => {
    const keep = durationMs > 0 ? durationMs : DEFAULT_DURATION_HOURS * HOUR;
    setStartsAt(start);
    setEndsAt(new Date(start.getTime() + keep));
  };

  const onPressSubmit = () => {
    const point = pinnedPoint(location);
    const problem = !title.trim()
      ? 'Give the pop-up a name.'
      : !point
        ? 'Set the location — search an address, use where you are, or enter the coordinates.'
        : !location.city.trim() || !location.venue.trim()
          ? 'Add the city and the venue guests should look for.'
          : endsAt <= startsAt
            ? 'The end has to be after the start.'
            : null;
    setError(problem);
    if (problem || !point) {
      haptics.error();
      return;
    }
    onSubmit({
      title: title.trim(),
      type,
      city: location.city.trim(),
      venue: location.venue.trim(),
      latitude: point.latitude,
      longitude: point.longitude,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      timeZone,
      description: description.trim(),
      imageUrl,
      capacity,
    });
  };

  return (
    <View style={styles.form}>
      <Card style={styles.group}>
        <GroupTitle icon="sparkles" title="Basics" />
        <TextField label="Name" value={title} onChangeText={setTitle} placeholder="e.g. Bánh mì on the Grote Markt" />
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
        <View style={styles.inlineRow}>
          <ThemedText type="smallBold" style={styles.flex}>
            Capacity
          </ThemedText>
          <Stepper
            value={capacity}
            onChange={setCapacity}
            min={CAPACITY.min}
            max={CAPACITY.max}
            step={CAPACITY.step}
            label="capacity"
            formatValue={(count) => `${count} people`}
          />
        </View>
        <TextField label="Description" value={description} onChangeText={setDescription} multiline />
      </Card>

      <Card style={styles.group}>
        <GroupTitle icon="photo" title="Photo" />
        <EventImagePicker value={imageUrl} onChange={setImageUrl} />
      </Card>

      <Card style={styles.group}>
        <GroupTitle icon="pin" title="Where" />
        <LocationPicker value={location} onChange={setLocation} />
      </Card>

      <Card style={styles.group}>
        <GroupTitle icon="calendar" title="When" />
        {endsAt > startsAt ? (
          <ThemedText type="smallBold" themeColor="primaryText">
            {formatEventWindow(startsAt.toISOString(), endsAt.toISOString(), timeZone)}
          </ThemedText>
        ) : null}
        <View style={styles.pills}>
          {START_PRESETS.map((preset) => (
            <OptionPill key={preset.label} label={preset.label} onPress={() => onChangeStart(preset.start(timeZone))} />
          ))}
        </View>
        <DateTimeField label="Starts" value={startsAt} onChange={onChangeStart} timeZone={timeZone} />
        <DateTimeField label="Ends" value={endsAt} onChange={setEndsAt} minimumDate={startsAt} timeZone={timeZone} />
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
                onPress={() => setEndsAt(new Date(startsAt.getTime() + hours * HOUR))}
              />
            ))}
          </View>
        </View>
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
  flex: {
    flex: 1,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
