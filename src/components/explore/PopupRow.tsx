import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { formatInTimeZone } from 'date-fns-tz';

import { ThemedText } from '@/components/ThemedText';
import Chip from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { onPhoto, onPhotoSoft, PhotoShade } from '@/components/ui/PhotoShade';
import { ripple } from '@/components/ui/ripple';
import { popUpImage } from '@/constants/brandPhotos';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { useBusyStore } from '@/state/busyStore';
import { useLocationStore } from '@/state/locationStore';
import { nameFromContent } from '@/utils/a11y';
import { formatEventWindow, getEventPhase } from '@/utils/dateTime';
import { distanceInMeters, formatDistance } from '@/utils/distance';
import type { PopUpEvent } from '@/types';

/** How far away a pop-up is, once we know where you are. */
function useDistance(event: PopUpEvent) {
  const coordinates = useLocationStore((state) => state.coordinates);
  return coordinates ? formatDistance(distanceInMeters(coordinates, event.coordinates)) : null;
}

/**
 * A pop-up as a poster: its photo edge to edge, "Live now" or "Coming up",
 * the name big, where, when and how far over a soft shade, how busy when
 * it's on, and its pills (`actions`) along the bottom. Tapping the words
 * opens the pop-up.
 */
export function PopUpPoster({
  event,
  onOpen,
  actions,
  tall = false,
}: {
  event: PopUpEvent;
  onOpen: () => void;
  /** PhotoPills: the main one sage, the rest glass. */
  actions: ReactNode;
  /** Taller than wide, for Home; nearly square in a list. */
  tall?: boolean;
}) {
  const theme = useTheme();
  const distance = useDistance(event);
  const busy = useBusyStore((state) => state.busy[event.id] ?? event.busy);
  const live = getEventPhase(event.startsAt, event.endsAt) === 'live';
  const meta = [event.venue, formatEventWindow(event.startsAt, event.endsAt, event.timeZone), distance]
    .filter(Boolean)
    .join(' · ');
  return (
    <View style={[styles.poster, { aspectRatio: tall ? 0.82 : 0.95, backgroundColor: theme.surfaceDark }]}>
      <Image
        accessible={false}
        accessibilityLabel=""
        source={popUpImage(event)}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <PhotoShade from={0} to={0.86} />
      <Pressable
        onPress={() => {
          haptics.tap();
          onOpen();
        }}
        accessibilityRole="button"
        {...nameFromContent(`${live ? 'Live now' : 'Coming up'}: ${event.title}. Open the pop-up.`)}
        style={styles.posterText}
      >
        {live ? (
          <Chip label="Live now" tone="live" />
        ) : (
          <ThemedText type="label" style={onPhotoSoft}>
            Coming up
          </ThemedText>
        )}
        <ThemedText type="title" numberOfLines={3} style={onPhoto}>
          {event.title}
        </ThemedText>
        <ThemedText type="small" style={onPhotoSoft}>
          {meta}
        </ThemedText>
        {live && busy.capacity > 0 ? <BusyLine occupancy={busy.occupancy} capacity={busy.capacity} /> : null}
      </Pressable>
      <View style={styles.actions}>{actions}</View>
    </View>
  );
}

/** How busy a live pop-up is: a thin sage bar on the photo and "9 of 80". */
function BusyLine({ occupancy, capacity }: { occupancy: number; capacity: number }) {
  const theme = useTheme();
  const share = Math.min(1, occupancy / capacity);
  return (
    <View style={styles.busy}>
      <View style={styles.busyTrack} aria-hidden>
        <View style={[styles.busyFill, { width: `${Math.max(share, 0.04) * 100}%`, backgroundColor: theme.brand }]} />
      </View>
      <ThemedText type="caption" style={onPhotoSoft}>
        How busy: {occupancy} of {capacity}
      </ThemedText>
    </View>
  );
}

/**
 * A pop-up as a line in a programme: the date big, a small photo, the name,
 * when, where and how far, an arrow. Hairlines between the lines.
 */
function PopupRowComponent({ event, last, onPress }: { event: PopUpEvent; last: boolean; onPress: () => void }) {
  const theme = useTheme();
  const distance = useDistance(event);
  const start = new Date(event.startsAt);
  const day = formatInTimeZone(start, event.timeZone, 'dd');
  const month = formatInTimeZone(start, event.timeZone, 'MMM');
  const when = [formatInTimeZone(start, event.timeZone, 'EEE HH:mm'), event.city, distance].filter(Boolean).join(' · ');
  return (
    <Pressable
      android_ripple={ripple(theme.text)}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      {...nameFromContent(
        [event.title, formatInTimeZone(start, event.timeZone, 'EEE d MMM, HH:mm'), event.city, distance]
          .filter(Boolean)
          .join(', '),
      )}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: theme.border },
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.date}>
        <ThemedText type="subtitle">{day}</ThemedText>
        <ThemedText type="label" themeColor="textSecondary">
          {month}
        </ThemedText>
      </View>
      <View style={[styles.rowPhoto, { backgroundColor: theme.backgroundSelected }]}>
        <Image
          accessible={false}
          accessibilityLabel=""
          source={popUpImage(event)}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      </View>
      <View style={styles.rowTexts}>
        <ThemedText type="card" numberOfLines={2}>
          {event.title}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {when}
        </ThemedText>
      </View>
      <Icon name="chevronRight" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

export const PopupRow = memo(PopupRowComponent);

const styles = StyleSheet.create({
  poster: {
    borderRadius: Radius.tile,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  posterText: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 6,
    alignItems: 'flex-start',
  },
  busy: {
    alignSelf: 'stretch',
    gap: 6,
    paddingTop: 6,
  },
  busyTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(250, 249, 245, 0.28)',
  },
  busyFill: {
    height: 4,
    borderRadius: 2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 20,
    paddingTop: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  // At least 44 wide, and wider when large text needs it ("NOV" never cut).
  date: {
    minWidth: 44,
    alignItems: 'center',
  },
  rowPhoto: {
    width: 56,
    height: 56,
    borderRadius: Radius.large,
    overflow: 'hidden',
  },
  rowTexts: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
