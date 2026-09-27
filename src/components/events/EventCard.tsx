import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import CapacityMeter from '@/components/events/CapacityMeter';
import { Card } from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { ThemedText } from '@/components/ThemedText';
import { Radius, Spacing } from '@/constants/theme';
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
 * Events-list card: a big calendar numeral, phase and distance chips, the
 * title, where and when, and a live "how busy" bar. Opens the event.
 */
function EventCardComponent({ event, onPress }: EventCardProps) {
  const theme = useTheme();
  const busy = useBusyStore((state) => state.busy[event.id] ?? event.busy);
  const userCoordinates = useLocationStore((state) => state.coordinates);

  const badge = formatDayBadge(event.startsAt, event.timeZone);
  const phase = getEventPhase(event.startsAt, event.endsAt);
  const isFull = busy.occupancy >= busy.capacity;
  const distance = userCoordinates ? distanceInMeters(userCoordinates, event.coordinates) : null;

  const timeLabel = formatEventWindow(event.startsAt, event.endsAt, event.timeZone);
  const label =
    `${event.title} in ${event.city}, ${timeLabel}. ` +
    `${phase === 'live' ? 'Live now. ' : ''}` +
    (isFull ? 'Full. ' : `${busy.occupancy} of ${busy.capacity} busy. `) +
    (distance !== null ? `${formatDistance(distance)} away. ` : '') +
    'Open details.';

  return (
    <Card onPress={onPress} accessibilityLabel={label} style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.date, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="label" themeColor="textSecondary" style={styles.dateLabel}>
            {badge.weekday}
          </ThemedText>
          <ThemedText type="subtitle" style={[styles.day, { color: theme.brand }]}>
            {badge.day}
          </ThemedText>
          <ThemedText type="label" themeColor="textSecondary" style={styles.dateLabel}>
            {badge.month}
          </ThemedText>
        </View>

        <View style={styles.main}>
          <View style={styles.chips}>
            <Chip label={PHASE_LABELS[phase]} tone={phase === 'live' ? 'live' : 'neutral'} />
            {isFull ? <Chip label="Full" tone="danger" /> : null}
            {distance !== null ? <Chip label={formatDistance(distance)} icon="distance" /> : null}
          </View>
          <ThemedText type="section" numberOfLines={2}>
            {event.title}
          </ThemedText>
          <View style={styles.meta}>
            <Icon name="clock" size={13} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.metaText}>
              {timeLabel} · {event.city}
            </ThemedText>
          </View>
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
  date: {
    width: 64,
    borderRadius: Radius.medium,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  dateLabel: {
    fontSize: 11,
    lineHeight: 13,
  },
  day: {
    fontSize: 34,
    lineHeight: 36,
  },
  main: {
    flex: 1,
    gap: Spacing.one + 2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  metaText: {
    flex: 1,
  },
});
