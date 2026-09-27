import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ArrowRight, CalendarRange, ClipboardList, Plus } from 'lucide-react-native';

import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Spacing } from '@/constants/theme';
import { useOwnerEvents } from '@/hooks/useOwnerEvents';
import { useOwnerOrders } from '@/hooks/useOwnerOrders';
import { useTheme } from '@/hooks/useTheme';
import { ownerEventGroup } from '@/components/owner/ownerEventPhase';

/**
 * Owner tools home: orders first (what needs doing now), then pop-ups —
 * create a new one, or manage the ones you have.
 */
export default function OwnerHomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { orders } = useOwnerOrders();
  const eventsQuery = useOwnerEvents();

  const orderCounts = useMemo(
    () => ({
      new: orders.filter((order) => order.status === 'paid').length,
      preparing: orders.filter((order) => order.status === 'preparing').length,
      ready: orders.filter((order) => order.status === 'ready').length,
    }),
    [orders],
  );

  const eventCounts = useMemo(() => {
    const groups = (eventsQuery.data ?? []).map((event) => ownerEventGroup(event));
    return {
      live: groups.filter((group) => group === 'live').length,
      upcoming: groups.filter((group) => group === 'upcoming').length,
    };
  }, [eventsQuery.data]);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <ThemedText type="section">Orders</ThemedText>
      <Card
        tone="accent"
        onPress={() => router.push('/(profile)/owner/orders')}
        accessibilityLabel={`Manage incoming orders: ${orderCounts.new} new, ${orderCounts.preparing} preparing, ${orderCounts.ready} ready`}
      >
        <View style={styles.cardHeader}>
          <ClipboardList size={22} color={theme.onAccent} />
          <ThemedText type="section" style={[styles.flex, { color: theme.onAccent }]}>
            Manage orders
          </ThemedText>
          <ArrowRight size={20} color={theme.onAccent} />
        </View>
        <View style={styles.counters}>
          <Counter label="New" value={orderCounts.new} emphasized={orderCounts.new > 0} />
          <Counter label="Preparing" value={orderCounts.preparing} />
          <Counter label="Ready" value={orderCounts.ready} />
        </View>
      </Card>

      <ThemedText type="section" style={styles.sectionTitle}>
        Pop-ups
      </ThemedText>
      <Card
        tone="primary"
        onPress={() => router.push('/(profile)/owner/event/new')}
        accessibilityLabel="Create a new pop-up event"
      >
        <View style={styles.cardHeader}>
          <Plus size={24} color={theme.onPrimary} strokeWidth={3} />
          <ThemedText type="section" style={[styles.flex, { color: theme.onPrimary }]}>
            Create new pop-up
          </ThemedText>
          <ArrowRight size={20} color={theme.onPrimary} />
        </View>
        <ThemedText type="small" style={{ color: theme.onPrimary }}>
          Set one up where you&apos;re standing, or plan the next one.
        </ThemedText>
      </Card>

      <Card
        onPress={() => router.push('/(profile)/owner/events')}
        accessibilityLabel={`Manage pop-ups: ${eventCounts.live} live, ${eventCounts.upcoming} upcoming`}
      >
        <View style={styles.cardHeader}>
          <CalendarRange size={22} color={theme.text} />
          <ThemedText type="section" style={styles.flex}>
            Manage pop-ups
          </ThemedText>
          <ArrowRight size={20} color={theme.text} />
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {eventCounts.live} live · {eventCounts.upcoming} upcoming — QR codes, menus and
          challenges.
        </ThemedText>
      </Card>
    </ScrollView>
  );
}

/** One order-status count on the orders card. */
function Counter({ label, value, emphasized = false }: { label: string; value: number; emphasized?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.counter,
        {
          backgroundColor: emphasized ? theme.highlight : theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}
    >
      <ThemedText type="subtitle" style={{ color: emphasized ? theme.onHighlight : theme.text }}>
        {value}
      </ThemedText>
      <ThemedText type="label" style={{ color: emphasized ? theme.onHighlight : theme.text }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  sectionTitle: {
    marginTop: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  counters: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  counter: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: Spacing.two,
  },
});
