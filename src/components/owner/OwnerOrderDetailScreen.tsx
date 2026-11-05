import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatInTimeZone } from 'date-fns-tz';

import { columnFor, NEXT_STEP, untilPickup } from '@/components/owner/ownerOrderFormat';
import { ThemedText } from '@/components/ThemedText';
import { BlockButton } from '@/components/ui/BlockButton';
import { ListRow } from '@/components/ui/ListRow';
import { StepBar } from '@/components/ui/StepBar';
import { TextLink } from '@/components/ui/TextLink';
import { TopBar } from '@/components/ui/TopBar';
import { PageInset } from '@/constants/theme';
import { useNow } from '@/hooks/useNow';
import { useOwnerOrders } from '@/hooks/useOwnerOrders';
import { useTheme } from '@/hooks/useTheme';
import { confirm } from '@/services/confirm';
import { haptics } from '@/services/haptics';
import { DISPLAY_TIME_ZONE } from '@/utils/dateTime';
import { formatCents, ORDER_STATUS_TITLE, pickupCode } from '@/utils/orderFormat';

const STEPS = ['New', 'Being made', 'Ready'];
const STEP_INDEX = { new: 0, preparing: 1, ready: 2, collected: 2 } as const;

/**
 * A-03 Order detail: the pickup time biggest (it sets the order of work),
 * how far along it is, what to make, and the next step at the bottom.
 */
export default function OwnerOrderDetailScreen({ orderId }: { orderId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const now = useNow(30_000).getTime();
  const { orders, info, isLoading, advance, advancing } = useOwnerOrders();
  const order = orders.find((candidate) => candidate.id === orderId);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(profile)/owner/orders'));

  if (!order) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <TopBar title="Order" onBack={back} />
        <View style={styles.state}>
          {isLoading ? (
            <ActivityIndicator accessibilityLabel="Loading" color={theme.text} />
          ) : (
            <ThemedText type="caption" themeColor="textSecondary">
              This order isn’t on the board.
            </ThemedText>
          )}
        </View>
      </View>
    );
  }

  const about = info[order.id];
  const column = columnFor(order.status);
  const next = column ? NEXT_STEP[column] : undefined;
  const pickup = order.pickup_at ? formatInTimeZone(order.pickup_at, DISPLAY_TIME_ZONE, 'HH:mm') : 'ASAP';

  const onCancel = async () => {
    const yes = await confirm('Cancel this order?', 'The customer sees it as cancelled.', 'Cancel order');
    if (!yes) return;
    haptics.warning();
    advance({ orderId: order.id, status: 'cancelled' }, { onSuccess: back });
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <TopBar title={pickupCode(order.id)} onBack={back} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.head}>
          <ThemedText type="name" accessibilityRole="header">
            Pickup {pickup}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {[untilPickup(order.pickup_at, now, true), about?.name].filter(Boolean).join(' · ')}
          </ThemedText>
        </View>

        <View style={[styles.block, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="title">{column === 'new' ? 'New' : ORDER_STATUS_TITLE[order.status]}</ThemedText>
          {column ? (
            <View style={styles.steps}>
              <StepBar steps={STEPS} reached={STEP_INDEX[column]} />
            </View>
          ) : null}
        </View>

        <View style={styles.page}>
          <ThemedText type="section" accessibilityRole="header">
            Make this
          </ThemedText>
          <View>
            {(about?.lines ?? []).map((line) => (
              <ListRow
                key={line.id}
                title={`${line.quantity} × ${line.name}`}
                subtitle={line.options ?? undefined}
                value={formatCents(line.totalCents)}
              />
            ))}
            <ListRow
              title="Reward used"
              value={order.discount_cents ? `−${formatCents(order.discount_cents)}` : 'None'}
            />
            <ListRow title="Total, pay at pickup" value={formatCents(order.total_cents)} last />
          </View>
          {column && column !== 'collected' ? <TextLink label="Cancel order" onPress={() => void onCancel()} /> : null}
        </View>
      </ScrollView>
      {next ? (
        <BlockButton
          label={next.label}
          loading={advancing}
          onPress={() => advance({ orderId: order.id, status: next.status })}
          bottomInset
        />
      ) : null}
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
  scroll: {
    paddingBottom: 24,
  },
  head: {
    paddingHorizontal: PageInset,
    paddingTop: 4,
    paddingBottom: 16,
    gap: 4,
  },
  block: {
    paddingHorizontal: PageInset,
    paddingVertical: 16,
  },
  steps: {
    marginTop: 12,
  },
  page: {
    paddingHorizontal: PageInset,
    paddingTop: 18,
    gap: 8,
  },
});
