import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useOwnerOrders } from '@/hooks/useOwnerOrders';
import { useTheme } from '@/hooks/useTheme';
import { formatCents, pickupCode } from '@/utils/orderFormat';
import type { OwnerOrderRow } from '@/api/owner';
import type { OrderStatus } from '@/types/database';

const COLUMNS: { status: OrderStatus | 'new'; label: string }[] = [
  { status: 'new', label: 'New' },
  { status: 'preparing', label: 'Preparing' },
  { status: 'ready', label: 'Ready' },
  { status: 'collected', label: 'Collected' },
];

/** New = paid orders that haven't started preparation yet. */
function columnFor(order: OwnerOrderRow): (typeof COLUMNS)[number]['status'] {
  return order.status === 'paid' ? 'new' : order.status;
}

const NEXT_STATUS: Record<string, 'preparing' | 'ready' | 'collected' | undefined> = {
  new: 'preparing',
  preparing: 'ready',
  ready: 'collected',
};

/** Owner: a simple board grouped by status — advance or cancel each order. */
export default function OwnerOrdersScreen() {
  const theme = useTheme();
  const { orders, isLoading, advance } = useOwnerOrders();

  if (isLoading) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  const visible = orders.filter((order) => order.status !== 'cancelled');

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {COLUMNS.map((column) => {
        const columnOrders = visible.filter((order) => columnFor(order) === column.status);
        const nextStatus = NEXT_STATUS[column.status];
        return (
          <View key={column.status} style={styles.column}>
            <ThemedText type="section">
              {column.label} · {columnOrders.length}
            </ThemedText>
            {columnOrders.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Nothing here.
              </ThemedText>
            ) : (
              columnOrders.map((order) => (
                <View
                  key={order.id}
                  style={[
                    styles.row,
                    {
                      borderColor: theme.border,
                      backgroundColor: column.status === 'new' ? theme.highlight : theme.backgroundElement,
                    },
                  ]}
                >
                  <View style={styles.rowTexts}>
                    {/* Same code the customer shows at pickup. */}
                    <ThemedText
                      type="subtitle"
                      style={column.status === 'new' ? { color: theme.onHighlight } : undefined}
                    >
                      {pickupCode(order.id)}
                    </ThemedText>
                    <ThemedText
                      type="smallBold"
                      themeColor={column.status === 'new' ? undefined : 'primaryText'}
                      style={column.status === 'new' ? { color: theme.onHighlight } : undefined}
                    >
                      {formatCents(order.total_cents)}
                    </ThemedText>
                  </View>
                  {nextStatus ? (
                    <Pressable
                      onPress={() => advance({ orderId: order.id, status: nextStatus })}
                      accessibilityRole="button"
                      accessibilityLabel={`Move order to ${nextStatus}`}
                      style={[styles.advanceButton, { backgroundColor: theme.accent, borderColor: theme.border }]}
                    >
                      <ThemedText type="label" style={{ color: theme.onAccent }}>
                        → {nextStatus}
                      </ThemedText>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => advance({ orderId: order.id, status: 'cancelled' })}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel order"
                    hitSlop={8}
                  >
                    <ThemedText type="label" themeColor="danger">
                      Cancel
                    </ThemedText>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  column: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    borderWidth: 2,
    padding: Spacing.three,
  },
  rowTexts: {
    flex: 1,
    gap: 2,
  },
  advanceButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 10,
    borderWidth: 2,
  },
});
