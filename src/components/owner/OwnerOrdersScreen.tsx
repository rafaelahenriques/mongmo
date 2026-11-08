import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatInTimeZone } from 'date-fns-tz';

import { COLUMN_LABEL, columnFor, NEXT_STEP, untilPickup, type OwnerColumn } from '@/components/owner/ownerOrderFormat';
import { ThemedText } from '@/components/ThemedText';
import { BlockButton } from '@/components/ui/BlockButton';
import { Segmented } from '@/components/ui/Segmented';
import { CardShadow, PageInset } from '@/constants/theme';
import { useNow } from '@/hooks/useNow';
import { useOwnerOrders } from '@/hooks/useOwnerOrders';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { DISPLAY_TIME_ZONE } from '@/utils/dateTime';
import { formatCents, pickupCode } from '@/utils/orderFormat';
import { nameFromContent } from '@/utils/a11y';
import { EmptyState, ErrorState, LoadingState, useRefreshControl } from '@/components/ui/LoadState';

/**
 * A-02 Orders board: New, Being made, Ready as underlined words with
 * counts, each order a ticket — code, pickup time, who, what — and one tap
 * to move it on. Open a ticket for the detail.
 */
export default function OwnerOrdersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const now = useNow(30_000).getTime();
  const { orders, info, isLoading, isError, refetch, advance } = useOwnerOrders();
  const refreshControl = useRefreshControl();
  const [column, setColumn] = useState<OwnerColumn>('new');

  const count = (target: OwnerColumn) => orders.filter((order) => columnFor(order.status) === target).length;
  // Soonest pickup first: it sets the order of work.
  const shown = orders
    .filter((order) => columnFor(order.status) === column)
    .sort((a, b) => (a.pickup_at ?? a.created_at).localeCompare(b.pickup_at ?? b.created_at));
  const next = NEXT_STEP[column];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 32 }]}
      refreshControl={refreshControl}
    >
      <Segmented
        options={(Object.keys(COLUMN_LABEL) as OwnerColumn[]).map((value) => ({
          value,
          label: COLUMN_LABEL[value],
          count: count(value),
        }))}
        value={column}
        onChange={setColumn}
        accessibilityLabel="Orders"
        look="tabs"
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message="Couldn’t load the orders." onRetry={() => void refetch()} />
      ) : shown.length === 0 ? (
        <EmptyState
          icon="receipt"
          sticker="stool"
          text={
            column === 'new'
              ? 'No new orders. They show up here as customers place them.'
              : `No ${COLUMN_LABEL[column].toLowerCase()} orders right now.`
          }
        />
      ) : (
        shown.map((order) => {
          const about = info[order.id];
          const code = pickupCode(order.id);
          return (
            <View
              key={order.id}
              style={[styles.ticket, { backgroundColor: theme.backgroundElement, boxShadow: CardShadow }]}
            >
              <Pressable
                onPress={() => {
                  haptics.tap();
                  router.push({ pathname: '/(profile)/owner/order/[id]', params: { id: order.id } });
                }}
                accessibilityRole="button"
                {...nameFromContent(`Order ${code}${about?.name ? ` for ${about.name}` : ''}. Open.`)}
                style={styles.ticketBody}
              >
                <View style={styles.ticketTop}>
                  <ThemedText type="title" style={styles.flex}>
                    {code}
                  </ThemedText>
                  <ThemedText type="captionBold">
                    {order.pickup_at
                      ? `Pickup ${formatInTimeZone(order.pickup_at, DISPLAY_TIME_ZONE, 'HH:mm')}`
                      : 'Pickup ASAP'}
                  </ThemedText>
                </View>
                {about?.name ? <ThemedText type="smallBold">{about.name}</ThemedText> : null}
                {about?.lines.length ? (
                  <ThemedText type="caption" themeColor="textSecondary">
                    {about.lines
                      .map(
                        (line) =>
                          `${line.quantity > 1 ? `${line.quantity} × ` : ''}${line.name}` +
                          (line.options ? ` (${line.options.toLowerCase()})` : ''),
                      )
                      .join('. ')}
                  </ThemedText>
                ) : null}
              </Pressable>
              <View style={styles.ticketFoot}>
                <ThemedText type="caption" themeColor="textSecondary" style={styles.until}>
                  {/* Paid at pickup: the amount to take until it's handed over. */}
                  {order.paid_at
                    ? `€${formatCents(order.total_cents)} paid`
                    : `${untilPickup(order.pickup_at, now)} · €${formatCents(order.total_cents)} to pay`}
                </ThemedText>
                {next ? (
                  <BlockButton
                    label={next.label}
                    size="compact"
                    tone={column === 'new' ? 'sage' : 'dark'}
                    onPress={() => advance({ orderId: order.id, status: next.status })}
                  />
                ) : null}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PageInset,
    paddingTop: 4,
    gap: 10,
  },
  loader: {
    marginVertical: 24,
  },
  empty: {
    paddingVertical: 16,
  },
  flex: {
    flex: 1,
  },
  ticket: {
    marginTop: 2,
  },
  ticketBody: {
    gap: 2,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  ticketTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ticketFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  until: {
    paddingLeft: 14,
  },
});
