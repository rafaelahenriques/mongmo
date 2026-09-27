import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useOrder } from '@/hooks/useOrder';
import { useTheme } from '@/hooks/useTheme';
import { formatCents, ORDER_STATUS_LABEL, pickupCode } from '@/utils/orderFormat';
import type { OrderStatus } from '@/types/database';

const STEPS: OrderStatus[] = ['paid', 'preparing', 'ready', 'collected'];

/** Live order status: pickup code, a simple progress timeline, and the line items. */
export default function OrderStatusScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = typeof id === 'string' ? id : '';
  const { order, items } = useOrder(orderId);

  if (order.isPending) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  if (!order.data) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ThemedText type="smallBold">Order not found</ThemedText>
      </View>
    );
  }

  const currentStepIndex = STEPS.indexOf(order.data.status);
  const cancelled = order.data.status === 'cancelled';

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.codeBox, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
        <ThemedText type="small" themeColor="textSecondary">
          Pickup code
        </ThemedText>
        <ThemedText type="title" style={styles.code}>
          {pickupCode(order.data.id)}
        </ThemedText>
      </View>

      {cancelled ? (
        <ThemedText type="smallBold" themeColor="danger">
          This order was cancelled.
        </ThemedText>
      ) : (
        <View style={styles.timeline}>
          {STEPS.map((step, index) => {
            const reached = currentStepIndex >= index;
            return (
              <View key={step} style={styles.timelineRow}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: reached ? theme.success : theme.backgroundSelected },
                  ]}
                />
                <ThemedText
                  type={reached ? 'smallBold' : 'small'}
                  themeColor={reached ? undefined : 'textSecondary'}
                >
                  {ORDER_STATUS_LABEL[step]}
                </ThemedText>
              </View>
            );
          })}
        </View>
      )}

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Items
      </ThemedText>
      {(items.data ?? []).map((item) => (
        <View key={item.id} style={styles.row}>
          <ThemedText type="small">
            {item.quantity}× {item.name_snapshot}
          </ThemedText>
          <ThemedText type="small">{formatCents(item.line_total_cents)}</ThemedText>
        </View>
      ))}

      <View style={[styles.row, styles.totalRow, { borderColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">Total</ThemedText>
        <ThemedText type="smallBold">{formatCents(order.data.total_cents)}</ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBox: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.half,
  },
  code: {
    fontSize: 30,
    letterSpacing: 4,
  },
  timeline: {
    gap: Spacing.two,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionTitle: {
    marginTop: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
  },
});
