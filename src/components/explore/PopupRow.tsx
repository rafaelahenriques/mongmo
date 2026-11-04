import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { formatInTimeZone } from 'date-fns-tz';

import { MapSketch } from '@/components/map/MapSketch';
import { ThemedText } from '@/components/ThemedText';
import { BlockButton } from '@/components/ui/BlockButton';
import { Icon } from '@/components/ui/Icon';
import { CardShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { useBusyStore } from '@/state/busyStore';
import { useLocationStore } from '@/state/locationStore';
import { formatEventWindow } from '@/utils/dateTime';
import { distanceInMeters, formatDistance } from '@/utils/distance';
import type { PopUpEvent } from '@/types';

/**
 * A pop-up in the list (P-02): a little street map with its pin, the name
 * in uppercase, when and where, and a sage square to open it.
 */
function PopupRowComponent({ event, index, onPress }: { event: PopUpEvent; index: number; onPress: () => void }) {
  const theme = useTheme();
  const coordinates = useLocationStore((state) => state.coordinates);
  const distance = coordinates ? formatDistance(distanceInMeters(coordinates, event.coordinates)) : null;
  const when = formatEventWindow(event.startsAt, event.endsAt, event.timeZone);
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={[event.title, when, event.city, distance].filter(Boolean).join(', ')}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, boxShadow: CardShadow, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <MapSketch variant={index} style={styles.map} />
      <View style={styles.texts}>
        <ThemedText type="card" numberOfLines={2}>
          {event.title}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {when}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {[distance, event.city].filter(Boolean).join(', ')}
        </ThemedText>
      </View>
      <View style={[styles.open, { backgroundColor: theme.brandFill }]}>
        <Icon name="chevronRight" size={18} color={theme.onBrand} weight="semibold" />
      </View>
    </Pressable>
  );
}

export const PopupRow = memo(PopupRowComponent);

/**
 * The live pop-up in the list: its photo with a LIVE NOW tag, the name, how
 * busy, until when, and the sage CHECK IN block.
 */
export function LiveCard({
  event,
  onOpen,
  onCheckIn,
}: {
  event: PopUpEvent;
  onOpen: () => void;
  onCheckIn: () => void;
}) {
  const theme = useTheme();
  const coordinates = useLocationStore((state) => state.coordinates);
  const busy = useBusyStore((state) => state.busy[event.id] ?? event.busy);
  const distance = coordinates ? formatDistance(distanceInMeters(coordinates, event.coordinates)) : null;
  const until = formatInTimeZone(new Date(event.endsAt), event.timeZone, 'HH:mm');

  return (
    <View style={[styles.live, { backgroundColor: theme.backgroundElement, boxShadow: CardShadow }]}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${event.title}, live now. ${busy.occupancy} of ${busy.capacity} busy. Open the pop-up.`}
      >
        <View style={[styles.photo, { backgroundColor: theme.surfaceDark }]}>
          {event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : null}
          <View style={[styles.liveTag, { backgroundColor: theme.brandFill }]}>
            <ThemedText type="label" style={{ color: theme.onBrand }}>
              Live now
            </ThemedText>
          </View>
        </View>
        <View style={styles.liveTexts}>
          <ThemedText type="card">{event.title}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {[event.venue, distance].filter(Boolean).join(' · ')}
            {'\n'}How busy: {busy.occupancy} of {busy.capacity}
          </ThemedText>
        </View>
      </Pressable>
      <View style={styles.liveFoot}>
        <View style={styles.until}>
          <Icon name="clock" size={16} color={theme.text} />
          <ThemedText type="caption">Until {until}</ThemedText>
        </View>
        <BlockButton label="Check in" size="compact" onPress={onCheckIn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 100,
  },
  map: {
    width: 104,
    alignSelf: 'stretch',
  },
  texts: {
    flex: 1,
    minWidth: 0,
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  open: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  live: {
    overflow: 'hidden',
  },
  photo: {
    height: 124,
  },
  liveTag: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveTexts: {
    gap: 4,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  liveFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  until: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 14,
  },
});
