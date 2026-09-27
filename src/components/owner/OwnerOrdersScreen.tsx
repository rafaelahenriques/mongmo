import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenScroll } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Spacing } from '@/constants/theme';
import { useOwnerOrders } from '@/hooks/useOwnerOrders';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { formatCents, pickupCode } from '@/utils/orderFormat';
import type { OwnerOrderRow } from '@/api/owner';

type Column = 'new' | 'preparing' | 'ready' | 'collected';

const COLUMN_LABEL: Record<Column, string> = {
  new: 'New',
  preparing: 'Preparing',
  ready: 'Ready',
  collected: 'Collected',
};

/** New = paid orders that haven't started preparation yet. */
function columnFor(order: OwnerOrderRow): Column | null {
  if (order.status === 'paid') return 'new';
  if (order.status === 'preparing' || order.status === 'ready' || order.status === 'collected') {
    return order.status;
  }
  return null;
}

const NEXT: Partial<Record<Column, { status: 'preparing' | 'ready' | 'collected'; label: string }>> = {
  new: { status: 'preparing', label: 'Start preparing' },
  preparing: { status: 'ready', label: 'Mark ready' },
  ready: { status: 'collected', label: 'Mark collected' },
};

/** Owner: orders by status — pick a column, then advance or cancel each order. */
export default function OwnerOrdersScreen() {
  const theme = useTheme();
  const { orders, isLoading, advance } = useOwnerOrders();
  const [column, setColumn] = useState<Column>('new');

  if (isLoading) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  const count = (target: Column) => orders.filter((order) => columnFor(order) === target).length;
  const columnOrders = orders.filter((order) => columnFor(order) === column);
  const next = NEXT[column];

  return (
    <ScreenScroll>
      <Segmented
        options={(Object.keys(COLUMN_LABEL) as Column[]).map((value) => ({
          value,
          label: `${COLUMN_LABEL[value]} ${count(value)}`,
        }))}
        value={column}
        onChange={setColumn}
        accessibilityLabel="Order status"
        style={styles.segmented}
      />

      {columnOrders.length === 0 ? (
        <View style={styles.empty}>
          <IconBadge name="receipt" size={56} />
          <ThemedText type="small" themeColor="textSecondary">
            No {COLUMN_LABEL[column].toLowerCase()} orders.
          </ThemedText>
        </View>
      ) : (
        columnOrders.map((order) => (
          <Card key={order.id} style={styles.order}>
            <View style={styles.orderTop}>
              <View style={styles.flex}>
                <ThemedText type="small" themeColor="textSecondary">
                  {new Date(order.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  {' · '}
                  {formatCents(order.total_cents)}
                </ThemedText>
                {/* Same code the customer shows at pickup. */}
                <ThemedText type="title" style={column === 'new' ? { color: theme.brand } : undefined}>
                  {pickupCode(order.id)}
                </ThemedText>
              </View>
              {column !== 'collected' ? (
                <IconButton
                  icon="close"
                  tone="muted"
                  size={36}
                  onPress={() => {
                    haptics.warning();
                    advance({ orderId: order.id, status: 'cancelled' });
                  }}
                  accessibilityLabel="Cancel order"
                />
              ) : null}
            </View>
            {next ? (
              <Button
                label={next.label}
                variant={column === 'new' ? 'brand' : 'primary'}
                size="medium"
                arrow
                haptic="press"
                onPress={() => advance({ orderId: order.id, status: next.status })}
                accessibilityLabel={`Move order to ${next.status}`}
              />
            ) : null}
          </Card>
        ))
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmented: {
    alignSelf: 'stretch',
    justifyContent: 'space-between',
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
  order: {
    gap: Spacing.three,
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
