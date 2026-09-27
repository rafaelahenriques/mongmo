import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Plus } from 'lucide-react-native';

import Chip from '@/components/ui/Chip';
import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useOwnerEvents } from '@/hooks/useOwnerEvents';
import { useTheme } from '@/hooks/useTheme';
import { formatEventWindow } from '@/utils/dateTime';
import type { OwnerEventSummary } from '@/api/owner';

const STATUS_TONE: Record<OwnerEventSummary['status'], 'success' | 'neutral' | 'danger'> = {
  scheduled: 'neutral',
  live: 'success',
  ended: 'neutral',
  cancelled: 'danger',
};

/** Owner: every event, tap to manage; a fixed "+" opens the create form. */
export default function OwnerEventsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const eventsQuery = useOwnerEvents();

  const openEvent = useCallback(
    (id: string) => router.push({ pathname: '/(profile)/owner/event/[id]', params: { id } }),
    [router],
  );
  const openOrders = useCallback(() => router.push('/(profile)/owner/orders'), [router]);
  const openNew = useCallback(() => router.push('/(profile)/owner/event/new'), [router]);

  if (eventsQuery.isPending) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Pressable
        onPress={openOrders}
        accessibilityRole="button"
        accessibilityLabel="Manage incoming orders"
        style={({ pressed }) => [
          styles.ordersRow,
          { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <ThemedText type="smallBold">Manage orders</ThemedText>
      </Pressable>

      <FlatList
        data={eventsQuery.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
            No events yet — tap + to create your first pop-up.
          </ThemedText>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openEvent(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${item.status}`}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <View style={styles.rowTexts}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {item.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {formatEventWindow(item.startsAt, item.endsAt, 'Europe/Brussels')} · {item.venue}, {item.city}
              </ThemedText>
            </View>
            <Chip label={item.status} tone={STATUS_TONE[item.status]} />
          </Pressable>
        )}
      />

      <Pressable
        onPress={openNew}
        accessibilityRole="button"
        accessibilityLabel="Create a new pop-up event"
        style={[styles.fab, { backgroundColor: '#8B4513' }]}
      >
        <Plus size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ordersRow: {
    margin: Spacing.three,
    marginBottom: 0,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    alignItems: 'center',
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  separator: {
    height: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
  rowTexts: {
    flex: 1,
    gap: 2,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.six,
  },
  fab: {
    position: 'absolute',
    right: Spacing.three,
    bottom: Spacing.three,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
