import { memo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { IconBadge } from '@/components/ui/IconBadge';
import { Spacing, TopTabInset } from '@/constants/theme';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { formatEventWindow, getStoreStatus } from '@/utils/dateTime';
import type { MapViewProps } from './MapView';

/** Room for the Map/List and date controls floating above the list. */
const CONTROLS_CLEARANCE = 128;

/**
 * Web fallback for react-native-maps (no web support): renders the same
 * store + events the map would pin, as a tappable list, so every route stays
 * usable and accessible from the browser.
 */
function MapViewWeb({ store, events, onSelectStore, onSelectEvent }: MapViewProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const status = store ? getStoreStatus(store.hours, store.timeZone) : null;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + TopTabInset + CONTROLS_CLEARANCE, paddingBottom: tabBarInset + Spacing.five },
      ]}
    >
      <ThemedText type="small" themeColor="textSecondary">
        The interactive map runs in the iOS/Android build — here is the same data as a list.
      </ThemedText>

      {store && status ? (
        <Card
          onPress={onSelectStore}
          accessibilityLabel={`Open details for ${store.name}, ${status.label}`}
          style={styles.row}
        >
          <IconBadge name="store" tone="primary" size={44} />
          <View style={styles.texts}>
            <ThemedText type="smallBold">{store.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {store.address} · Permanent store
            </ThemedText>
          </View>
          <Chip label={status.isOpen ? 'Open' : 'Closed'} tone={status.isOpen ? 'success' : 'neutral'} />
        </Card>
      ) : null}

      {events.map((event) => (
        <Card
          key={event.id}
          onPress={() => onSelectEvent(event.id)}
          accessibilityLabel={`Open details for ${event.title} in ${event.city}`}
          style={styles.row}
        >
          <IconBadge name="food" tone="brand" size={44} />
          <View style={styles.texts}>
            <ThemedText type="smallBold">{event.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatEventWindow(event.startsAt, event.endsAt, event.timeZone)}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {event.venue}, {event.city}
            </ThemedText>
          </View>
        </Card>
      ))}

      {events.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No pop-ups scheduled right now.
        </ThemedText>
      ) : null}
    </ScrollView>
  );
}

export default memo(MapViewWeb);

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.three + Spacing.one,
    gap: Spacing.two + Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
});
