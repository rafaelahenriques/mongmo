import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import CapacityMeter from '@/components/events/CapacityMeter';
import Chip from '@/components/ui/Chip';
import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useBusyStore } from '@/state/busyStore';
import { useLocationStore } from '@/state/locationStore';
import { distanceInMeters, formatDistance } from '@/utils/distance';
import { formatDayBadge, formatEventWindow, getEventPhase } from '@/utils/dateTime';
import type { PopUpEvent } from '@/types';

export type EventCardProps = {
  event: PopUpEvent;
  onPress: () => void;
};

const PHASE_LABELS = {
  upcoming: 'Upcoming',
  live: 'Live now',
  ended: 'Ended',
} as const;

/**
 * Events-list row: date badge, phase/distance chips, title, time window and
 * a live capacity meter. Tapping opens the event detail screen.
 */
function EventCardComponent({ event, onPress }: EventCardProps) {
  const theme = useTheme();
  const busy = useBusyStore((state) => state.busy[event.id] ?? event.busy);
  const userCoordinates = useLocationStore((state) => state.coordinates);

  const badge = formatDayBadge(event.startsAt, event.timeZone);
  const phase = getEventPhase(event.startsAt, event.endsAt);
  const isFull = busy.occupancy >= busy.capacity;
  const distance = userCoordinates
    ? distanceInMeters(userCoordinates, event.coordinates)
    : null;

  const timeLabel = formatEventWindow(event.startsAt, event.endsAt, event.timeZone);
  const label =
    `${event.title} in ${event.city}, ${timeLabel}. ` +
    `${phase === 'live' ? 'Live now. ' : ''}` +
    (isFull
      ? 'Full. '
      : `${busy.occupancy} of ${busy.capacity} busy. `) +
    (distance !== null ? `${formatDistance(distance)} away. ` : '') +
    'Open details.';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.backgroundSelected,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.dateBadge, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="small" style={styles.badgeText}>
            {badge.weekday}
          </ThemedText>
          <ThemedText type="default" style={styles.badgeDay}>
            {badge.day}
          </ThemedText>
          <ThemedText type="small" style={styles.badgeText}>
            {badge.month}
          </ThemedText>
        </View>

        <View style={styles.main}>
          <View style={styles.chips}>
            <Chip
              label={PHASE_LABELS[phase]}
              tone={phase === 'live' ? 'success' : 'neutral'}
            />
            {isFull ? <Chip label="Full" tone="danger" /> : null}
            {distance !== null ? <Chip label={formatDistance(distance)} /> : null}
          </View>

          <ThemedText type="default" style={styles.title} numberOfLines={2}>
            {event.title}
          </ThemedText>

          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {timeLabel} · {event.city}
          </ThemedText>
        </View>
      </View>

      <CapacityMeter occupancy={busy.occupancy} capacity={busy.capacity} label="How busy" />
    </Pressable>
  );
}

export default memo(EventCardComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  dateBadge: {
    width: 60,
    borderRadius: 12,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    gap: 0,
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeDay: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
  },
  main: {
    flex: 1,
    gap: Spacing.one,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    marginTop: Spacing.half,
  },
});
