import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatInTimeZone } from 'date-fns-tz';
import { useQuery } from '@tanstack/react-query';

import { getOrderPoints } from '@/api/endpoints';
import { ThemedText } from '@/components/ThemedText';
import { BlockButton } from '@/components/ui/BlockButton';
import { ListRow } from '@/components/ui/ListRow';
import { StepBar } from '@/components/ui/StepBar';
import { TaskCard } from '@/components/ui/TaskCard';
import { TopBar } from '@/components/ui/TopBar';
import { PageInset } from '@/constants/theme';
import { orderPoints } from '@/constants/points';
import { useLevel } from '@/hooks/useLevel';
import { useOrder } from '@/hooks/useOrder';
import { usePlace } from '@/hooks/usePickupPlace';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { openDirections } from '@/services/directions';
import { haptics } from '@/services/haptics';
import { orderAgain } from '@/services/orderAgain';
import { formatCents, ORDER_STATUS_TITLE, ORDER_STEP, ORDER_STEPS, pickupCode } from '@/utils/orderFormat';

/**
 * O-05 Order status: the pickup code big with the faded word, how far it
 * is (Confirmed · Being made · Ready), where to pick it up, and what's in
 * it. A collected order can be ordered again.
 */
export default function OrderStatusScreen({ orderId }: { orderId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const { order, items } = useOrder(orderId);
  const data = order.data;
  const level = useLevel();
  const awarded = useQuery({
    queryKey: ['points', 'order', orderId],
    queryFn: () => getOrderPoints(orderId),
    enabled: data?.status === 'collected',
  });
  const place = usePlace(
    data
      ? data.event_id
        ? { type: 'event', eventId: data.event_id, eventTitle: '' }
        : data.store_id
          ? { type: 'store', storeId: data.store_id }
          : null
      : null,
  );

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(orders)'));

  if (!data) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <TopBar title="Your order" onBack={back} />
        <View style={styles.state}>
          {order.isPending ? (
            <ActivityIndicator color={theme.text} />
          ) : (
            <ThemedText type="caption" themeColor="textSecondary">
              Couldn’t find this order.
            </ThemedText>
          )}
        </View>
      </View>
    );
  }

  const code = pickupCode(data.id);
  const done = data.status === 'collected' || data.status === 'cancelled';
  // Collected: what the order actually earned. Before: the estimate, with
  // the first-order double or your level's bonus.
  const earned =
    awarded.data ??
    orderPoints(data.total_cents, { firstOrder: level.firstOrderBonus, bonusPct: level.current.orderBonusPct });
  const zone = place?.timeZone ?? 'Europe/Brussels';
  const pickup = data.pickup_at
    ? `Pick up at ${formatInTimeZone(data.pickup_at, zone, 'HH:mm')}`
    : 'Pick up as soon as it’s ready';

  const onOrderAgain = async () => {
    haptics.press();
    await orderAgain(data, place?.name).catch(() => 0);
    router.dismissTo('/(orders)');
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <TopBar title="Your order" onBack={back} />
      <ScrollView contentContainerStyle={{ paddingBottom: (done ? 24 : 32) + tabBarInset }}>
        <View style={styles.code}>
          <View accessible accessibilityLabel={`Pickup code ${code.split('').join(' ')}`} style={styles.center}>
            <ThemedText type="display" style={styles.codeText}>
              {code}
            </ThemedText>
            <ThemedText type="name" style={[styles.codeWord, { color: theme.faded }]}>
              PICKUP CODE
            </ThemedText>
          </View>
          <ThemedText type="caption" themeColor="textSecondary">
            Show this at the counter
          </ThemedText>
        </View>

        <View style={[styles.block, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="title" accessibilityRole="header">
            {ORDER_STATUS_TITLE[data.status]}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {data.status === 'cancelled' ? 'This order was cancelled.' : pickup}
          </ThemedText>
          {data.status !== 'cancelled' ? (
            <View style={styles.steps}>
              <StepBar steps={ORDER_STEPS} reached={ORDER_STEP[data.status] ?? 0} />
            </View>
          ) : null}
        </View>

        <View style={styles.page}>
          {place ? (
            <TaskCard
              icon={place.kind === 'store' ? 'store' : 'pin'}
              title={place.name}
              subtitle={`${place.openLabel} · Directions`}
              state="arrow"
              onPress={() => openDirections(place.coordinates, `${place.name}, ${place.address}`)}
              accessibilityLabel={`${place.name}, ${place.openLabel}. Directions.`}
            />
          ) : null}

          <View>
            {(items.data ?? []).map((line) => (
              <ListRow
                key={line.id}
                title={`${line.quantity > 1 ? `${line.quantity} × ` : ''}${line.name_snapshot}`}
                subtitle={line.options_snapshot ?? undefined}
                value={formatCents(line.line_total_cents)}
              />
            ))}
            {data.discount_cents ? <ListRow title="Reward" value={`−${formatCents(data.discount_cents)}`} /> : null}
            <ListRow title="Total" value={formatCents(data.total_cents)} last={data.status === 'cancelled'} />
            {data.status !== 'cancelled' && earned > 0 ? (
              <ListRow
                title="Points"
                subtitle={data.status === 'collected' ? 'Added to your Wallet' : 'Added when you pick it up'}
                value={`+${earned}`}
                last
              />
            ) : null}
          </View>
        </View>
      </ScrollView>
      {done ? <BlockButton label="Order again" onPress={() => void onOrderAgain()} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  code: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    paddingBottom: 22,
  },
  center: {
    alignItems: 'center',
  },
  codeText: {
    fontSize: 64,
    lineHeight: 68,
  },
  codeWord: {
    fontSize: 30,
    lineHeight: 32,
  },
  block: {
    paddingHorizontal: PageInset,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 2,
  },
  steps: {
    marginTop: 14,
  },
  page: {
    paddingHorizontal: PageInset,
    paddingTop: 16,
    gap: 12,
  },
});
