import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatInTimeZone } from 'date-fns-tz';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getOrderPoints } from '@/api/endpoints';
import { ThemedText } from '@/components/ThemedText';
import { BlockButton } from '@/components/ui/BlockButton';
import { ListRow } from '@/components/ui/ListRow';
import { StepBar } from '@/components/ui/StepBar';
import { TaskCard } from '@/components/ui/TaskCard';
import { TopBar } from '@/components/ui/TopBar';
import { PageInset, Radius } from '@/constants/theme';
import { orderPoints } from '@/constants/points';
import { useLevel } from '@/hooks/useLevel';
import { useOrder } from '@/hooks/useOrder';
import { usePlace } from '@/hooks/usePickupPlace';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { openDirections } from '@/services/directions';
import { haptics } from '@/services/haptics';
import { orderAgain } from '@/services/orderAgain';
import { nameFromContent } from '@/utils/a11y';
import { formatCents, ORDER_STATUS_TITLE, ORDER_STEP, ORDER_STEPS, pickupCode } from '@/utils/orderFormat';
import { ErrorState, useRefreshControl } from '@/components/ui/LoadState';
import { cancelMyOrder } from '@/api/orders';
import { Button } from '@/components/ui/Button';
import { confirm, showError } from '@/services/confirm';

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
  const queryClient = useQueryClient();
  const cancel = useMutation({
    mutationFn: () => cancelMyOrder(orderId),
    onSuccess: () => {
      haptics.success();
      // The order, the order lists, and the reward that came back.
      void queryClient.invalidateQueries();
    },
    onError: (error) => showError('Couldn’t cancel it', error),
  });
  const onCancel = async () => {
    const yes = await confirm(
      'Cancel this order?',
      'The café hasn’t started on it yet. A reward you used comes back to your Wallet.',
      'Cancel order',
      { cancelLabel: 'Keep it', destructive: true },
    );
    if (yes) cancel.mutate();
  };
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
  const refreshControl = useRefreshControl();

  if (!data) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <TopBar title="Your order" onBack={back} />
        <View style={styles.state}>
          {order.isPending ? (
            <ActivityIndicator accessibilityLabel="Loading" color={theme.text} />
          ) : order.isError ? (
            <ErrorState
              message="Couldn’t load your order."
              onRetry={() => void order.refetch()}
              style={styles.stateBox}
            />
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
      <ScrollView
        contentContainerStyle={{ paddingBottom: (done ? 24 : 32) + tabBarInset }}
        refreshControl={refreshControl}
      >
        {/* The pickup code as a ticket: sage, the code big, a tear line, where. */}
        <View style={[styles.ticket, { backgroundColor: theme.brandFill }]}>
          <View
            accessible
            accessibilityLabel={`Pickup code ${code.split('').join(' ')}. Show this at the counter.`}
            style={styles.ticketTop}
          >
            <ThemedText type="label" style={{ color: theme.onBrand }}>
              Pickup code
            </ThemedText>
            <ThemedText
              type="display"
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.codeText, { color: theme.onBrand }]}
            >
              {code}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.onBrand }}>
              Show this at the counter
            </ThemedText>
          </View>
          <View style={styles.tear} aria-hidden>
            <View style={[styles.notch, styles.notchLeft, { backgroundColor: theme.background }]} />
            <View style={[styles.tearLine, { borderColor: theme.onBrand }]} />
            <View style={[styles.notch, styles.notchRight, { backgroundColor: theme.background }]} />
          </View>
          <View style={styles.ticketBottom}>
            <ThemedText type="title" accessibilityRole="header" style={{ color: theme.onBrand }}>
              {ORDER_STATUS_TITLE[data.status]}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.onBrand }}>
              {data.status === 'cancelled' ? 'This order was cancelled.' : pickup}
            </ThemedText>
          </View>
        </View>

        {data.status !== 'cancelled' ? (
          <View style={styles.steps}>
            <StepBar steps={ORDER_STEPS} reached={ORDER_STEP[data.status] ?? 0} />
          </View>
        ) : null}

        <View style={styles.page}>
          {place ? (
            <TaskCard
              icon={place.kind === 'store' ? 'store' : 'pin'}
              title={place.name}
              subtitle={`${place.openLabel} · Directions`}
              state="arrow"
              onPress={() => openDirections(place.coordinates, `${place.name}, ${place.address}`)}
              {...nameFromContent(`${place.name}, ${place.openLabel}. Directions.`)}
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
          {/* Ordered by mistake: possible until the café accepts it. */}
          {data.status === 'placed' ? (
            <Button
              label="Cancel order"
              variant="danger"
              onPress={() => void onCancel()}
              loading={cancel.isPending}
              style={styles.cancel}
            />
          ) : null}
        </View>
      </ScrollView>
      {done ? <BlockButton label="Order again" onPress={() => void onOrderAgain()} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cancel: {
    marginTop: 24,
  },
  screen: {
    flex: 1,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateBox: {
    alignSelf: 'stretch',
    marginHorizontal: 20,
  },
  ticket: {
    marginHorizontal: PageInset,
    marginTop: 8,
    borderRadius: Radius.tile,
    overflow: 'hidden',
  },
  ticketTop: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 2,
  },
  codeText: {
    fontSize: 64,
    lineHeight: 70,
  },
  // A dashed tear line with a bite out of each edge, like a ticket stub.
  tear: {
    height: 24,
    justifyContent: 'center',
  },
  tearLine: {
    marginHorizontal: 20,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.35,
  },
  notch: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  notchLeft: {
    left: -12,
  },
  notchRight: {
    right: -12,
  },
  ticketBottom: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 22,
    gap: 2,
  },
  steps: {
    marginHorizontal: PageInset,
    marginTop: 18,
  },
  page: {
    paddingHorizontal: PageInset,
    paddingTop: 16,
    gap: 12,
  },
});
