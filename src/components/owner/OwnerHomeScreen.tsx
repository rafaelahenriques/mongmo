import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { IconBadge } from '@/components/ui/IconBadge';
import { ScreenScroll, SectionHeader } from '@/components/ui/Screen';
import { Radius, Spacing } from '@/constants/theme';
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
    <ScreenScroll>
      <SectionHeader title="Orders" />
      <Card
        tone="primary"
        onPress={() => router.push('/(profile)/owner/orders')}
        accessibilityLabel={`Manage incoming orders: ${orderCounts.new} new, ${orderCounts.preparing} preparing, ${orderCounts.ready} ready`}
        style={styles.ordersCard}
      >
        <View style={styles.cardHeader}>
          <IconBadge name="receipt" tone="accent" size={44} />
          <ThemedText type="section" style={[styles.flex, { color: theme.onPrimary }]}>
            Manage orders
          </ThemedText>
          <Icon name="arrowRight" size={20} color={theme.onPrimary} weight="bold" />
        </View>
        <View style={styles.counters}>
          <Counter label="New" value={orderCounts.new} emphasized={orderCounts.new > 0} />
          <Counter label="Preparing" value={orderCounts.preparing} />
          <Counter label="Ready" value={orderCounts.ready} />
        </View>
      </Card>

      <SectionHeader title="Pop-ups" />
      <Card
        tone="brand"
        onPress={() => router.push('/(profile)/owner/event/new')}
        accessibilityLabel="Create a new pop-up event"
      >
        <View style={styles.cardHeader}>
          <IconBadge name="add" tone="card" size={44} />
          <ThemedText type="section" style={[styles.flex, { color: theme.onBrand }]}>
            Create new pop-up
          </ThemedText>
          <Icon name="arrowRight" size={20} color={theme.onBrand} weight="bold" />
        </View>
        <ThemedText type="small" style={{ color: theme.onBrand }}>
          Set one up where you&apos;re standing, or plan the next one.
        </ThemedText>
      </Card>

      <Card
        onPress={() => router.push('/(profile)/owner/events')}
        accessibilityLabel={`Manage pop-ups: ${eventCounts.live} live, ${eventCounts.upcoming} upcoming`}
      >
        <View style={styles.cardHeader}>
          <IconBadge name="calendar" tone="muted" size={44} />
          <ThemedText type="section" style={styles.flex}>
            Manage pop-ups
          </ThemedText>
          <Icon name="arrowRight" size={20} color={theme.text} weight="bold" />
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {eventCounts.live} live · {eventCounts.upcoming} upcoming — QR codes, menus and challenges.
        </ThemedText>
      </Card>
    </ScreenScroll>
  );
}

/** One order-status count on the orders card. */
function Counter({ label, value, emphasized = false }: { label: string; value: number; emphasized?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.counter, { backgroundColor: emphasized ? theme.brandFill : 'rgba(255, 255, 255, 0.08)' }]}>
      <ThemedText type="subtitle" style={[styles.counterValue, { color: emphasized ? theme.onBrand : theme.onPrimary }]}>
        {value}
      </ThemedText>
      <ThemedText
        type="small"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={{ color: emphasized ? theme.onBrand : theme.onPrimary, opacity: 0.85 }}
      >
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  ordersCard: {
    gap: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
  },
  counters: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  counter: {
    flex: 1,
    borderRadius: Radius.medium,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two + 2,
    gap: 2,
  },
  counterValue: {
    fontSize: 36,
    lineHeight: 38,
  },
});
