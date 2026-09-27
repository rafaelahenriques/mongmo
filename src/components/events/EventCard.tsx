import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import CapacityMeter from '@/components/events/CapacityMeter';
import { Card } from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { ThemedText } from '@/components/ThemedText';
import { FontFamily, Spacing } from '@/constants/theme';
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
    <Card onPress={onPress} accessibilityLabel={label} style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.dateBadge, { backgroundColor: theme.primary, borderColor: theme.border }]}>
          <ThemedText type="label" style={[styles.badgeText, { color: theme.onPrimary }]}>
            {badge.weekday}
          </ThemedText>
          <ThemedText style={[styles.badgeDay, { color: theme.onPrimary }]}>{badge.day}</ThemedText>
          <ThemedText type="label" style={[styles.badgeText, { color: theme.onPrimary }]}>
            {badge.month}
          </ThemedText>
        </View>

        <View style={styles.main}>
          <View style={styles.chips}>
            <Chip label={PHASE_LABELS[phase]} tone={phase === 'live' ? 'live' : 'neutral'} />
            {isFull ? <Chip label="Full" tone="danger" /> : null}
            {distance !== null ? <Chip label={formatDistance(distance)} /> : null}
          </View>

          <ThemedText type="section" style={styles.title} numberOfLines={2}>
            {event.title}
          </ThemedText>

          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {timeLabel} · {event.city}
          </ThemedText>
        </View>
      </View>

      <CapacityMeter occupancy={busy.occupancy} capacity={busy.capacity} label="How busy" />
    </Card>
  );
}

export default memo(EventCardComponent);

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  dateBadge: {
    width: 60,
    borderRadius: 10,
    borderWidth: 2,
    paddingVertical: Spacing.one,
    alignItems: 'center',
    alignSelf: 'flex-start',
    transform: [{ rotate: '-3deg' }],
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 14,
  },
  badgeDay: {
    fontFamily: FontFamily.display,
    fontSize: 30,
    lineHeight: 32,
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
    marginTop: Spacing.half,
  },
});
