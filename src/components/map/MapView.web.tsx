import { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { formatEventWindow, getStoreStatus } from '@/utils/dateTime';
import type { MapViewProps } from './MapView';

/**
 * Web fallback for react-native-maps (no web support): renders the same
 * store + events the map would pin, as a tappable list, so every route stays
 * usable and accessible from the browser.
 */
function MapViewWeb({ store, events, onSelectStore, onSelectEvent }: MapViewProps) {
  const theme = useTheme();
  const status = store ? getStoreStatus(store.hours, store.timeZone) : null;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <ThemedText type="small" themeColor="textSecondary">
        The interactive map runs in the iOS/Android build — here is the same data as a list.
      </ThemedText>

      {store && status ? (
        <Pressable
          onPress={onSelectStore}
          accessibilityRole="button"
          accessibilityLabel={`Open details for ${store.name}, ${status.label}`}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <View style={styles.cardHeader}>
            <ThemedText type="smallBold">{store.name}</ThemedText>
            <ThemedText
              type="small"
              style={{ color: status.isOpen ? theme.success : theme.textSecondary }}
            >
              {status.label}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {store.address} · Permanent store
          </ThemedText>
        </Pressable>
      ) : null}

      {events.map((event) => (
        <Pressable
          key={event.id}
          onPress={() => onSelectEvent(event.id)}
          accessibilityRole="button"
          accessibilityLabel={`Open details for ${event.title} in ${event.city}`}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <ThemedText type="smallBold">{event.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatEventWindow(event.startsAt, event.endsAt, event.timeZone)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {event.venue}, {event.city}
          </ThemedText>
        </Pressable>
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
    padding: Spacing.three,
    gap: Spacing.two,
  },
  card: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
