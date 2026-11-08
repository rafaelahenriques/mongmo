import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ownerEventGroup } from '@/components/owner/ownerEventPhase';
import { ThemedText } from '@/components/ThemedText';
import { BlockButton } from '@/components/ui/BlockButton';
import { TaskCard } from '@/components/ui/TaskCard';
import { CardShadow, PageInset } from '@/constants/theme';
import { useOwnerEvents } from '@/hooks/useOwnerEvents';
import { useOwnerOrders } from '@/hooks/useOwnerOrders';
import { useReportedPhotos } from '@/hooks/usePhotos';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';

/**
 * A-01 Owner tools: today's orders as three big numbers (new ones are the
 * loudest), MANAGE ORDERS, then pop-ups — a new one, or the ones you have —
 * and reported photos waiting for a decision.
 */
export default function OwnerHomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const { orders } = useOwnerOrders();
  const eventsQuery = useOwnerEvents();
  const reported = useReportedPhotos();
  const toReview = reported.data?.length ?? 0;

  const counts = useMemo(
    () => ({
      new: orders.filter((order) => order.status === 'placed').length,
      preparing: orders.filter((order) => order.status === 'preparing').length,
      ready: orders.filter((order) => order.status === 'ready').length,
    }),
    [orders],
  );
  const events = useMemo(() => {
    const groups = (eventsQuery.data ?? []).map((event) => ownerEventGroup(event));
    return {
      live: groups.filter((group) => group === 'live').length,
      upcoming: groups.filter((group) => group === 'upcoming').length,
    };
  }, [eventsQuery.data]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 32 }]}
    >
      <View style={[styles.card, { backgroundColor: theme.backgroundElement, boxShadow: CardShadow }]}>
        <View
          style={styles.counts}
          accessible
          accessibilityLabel={`Orders: ${counts.new} new, ${counts.preparing} being made, ${counts.ready} ready`}
        >
          <Count value={counts.new} label="New" loud />
          <Count value={counts.preparing} label="Being made" />
          <Count value={counts.ready} label="Ready" />
        </View>
        <View style={styles.cardFoot}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.today}>
            Today
          </ThemedText>
          <BlockButton label="Manage orders" size="compact" onPress={() => router.push('/(profile)/owner/orders')} />
        </View>
      </View>

      <ThemedText type="subtitle" accessibilityRole="header">
        Pop-ups
      </ThemedText>
      <TaskCard
        icon="add"
        title="New pop-up"
        subtitle="Set it up where you're standing, or plan the next one"
        state="arrow"
        onPress={() => router.push('/(profile)/owner/event/new')}
      />
      <TaskCard
        icon="calendar"
        title="Manage pop-ups"
        subtitle={`${events.live} live, ${events.upcoming} upcoming`}
        state="arrow"
        onPress={() => router.push('/(profile)/owner/events')}
      />

      <ThemedText type="subtitle" accessibilityRole="header">
        Photos of the week
      </ThemedText>
      <TaskCard
        icon="photo"
        title="Reported photos"
        subtitle={toReview === 0 ? 'Nothing to review' : `${toReview} to review`}
        state="arrow"
        onPress={() => router.push('/(profile)/owner/reports')}
      />
    </ScrollView>
  );
}

/** A big number over its word; faded when there's nothing, ink when there is. */
function Count({ value, label, loud = false }: { value: number; label: string; loud?: boolean }) {
  const theme = useTheme();
  const color = value > 0 || loud ? theme.text : theme.faded;
  return (
    <View style={styles.count}>
      <ThemedText type="display" style={[styles.number, { color }]}>
        {value}
      </ThemedText>
      <ThemedText type="caption" style={{ color: value > 0 || loud ? theme.text : theme.textSecondary }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PageInset,
    paddingTop: 4,
    gap: 12,
  },
  card: {
    marginBottom: 12,
  },
  counts: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
  },
  count: {
    flex: 1,
  },
  number: {
    fontSize: 48,
    lineHeight: 52,
  },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  today: {
    paddingLeft: 16,
  },
});
