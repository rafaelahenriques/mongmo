import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconBadge } from '@/components/ui/IconBadge';
import { ScreenScroll, SectionHeader } from '@/components/ui/Screen';
import { Radius, Spacing } from '@/constants/theme';
import { useOrder } from '@/hooks/useOrder';
import { useTheme } from '@/hooks/useTheme';
import { formatCents, ORDER_STATUS_LABEL, pickupCode } from '@/utils/orderFormat';
import type { OrderStatus } from '@/types/database';

const STEPS: { status: OrderStatus; icon: IconName; caption: string }[] = [
  { status: 'paid', icon: 'receipt', caption: 'We’ve got your order' },
  { status: 'preparing', icon: 'flame', caption: 'On the grill' },
  { status: 'ready', icon: 'takeout', caption: 'Come and get it' },
  { status: 'collected', icon: 'check', caption: 'Enjoy!' },
];

/** Live order status: pickup code, a progress timeline, and the line items. */
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
        <IconBadge name="alert" size={48} />
        <ThemedText type="section">Order not found</ThemedText>
      </View>
    );
  }

  const currentStepIndex = STEPS.findIndex((step) => step.status === order.data.status);
  const cancelled = order.data.status === 'cancelled';
  const code = pickupCode(order.data.id);

  return (
    <ScreenScroll>
      <Card tone="primary" style={styles.codeCard}>
        <ThemedText type="label" style={{ color: theme.onPrimary, opacity: 0.75 }}>
          Pickup code
        </ThemedText>
        <ThemedText
          type="display"
          style={[styles.code, { color: theme.onPrimary }]}
          accessibilityLabel={`Pickup code ${code.split('').join(' ')}`}
        >
          {code}
        </ThemedText>
        <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
          {ORDER_STATUS_LABEL[order.data.status]}
        </ThemedText>
      </Card>

      {cancelled ? (
        <Card tone="muted" style={styles.cancelled}>
          <Icon name="alert" size={20} color={theme.danger} />
          <ThemedText type="smallBold" themeColor="danger">
            This order was cancelled.
          </ThemedText>
        </Card>
      ) : (
        <Card style={styles.timeline}>
          {STEPS.map((step, index) => {
            const reached = currentStepIndex >= index;
            const current = currentStepIndex === index;
            const last = index === STEPS.length - 1;
            return (
              <View key={step.status} style={styles.step}>
                <View style={styles.rail}>
                  <View
                    style={[
                      styles.node,
                      { backgroundColor: reached ? (current ? theme.brandFill : theme.primary) : theme.backgroundSelected },
                    ]}
                  >
                    <Icon
                      name={step.icon}
                      size={15}
                      color={reached ? (current ? theme.onBrand : theme.onPrimary) : theme.textSecondary}
                    />
                  </View>
                  {!last ? (
                    <View
                      style={[
                        styles.line,
                        { backgroundColor: currentStepIndex > index ? theme.primary : theme.backgroundSelected },
                      ]}
                    />
                  ) : null}
                </View>
                <View style={styles.stepTexts}>
                  <ThemedText type="smallBold" themeColor={reached ? undefined : 'textSecondary'}>
                    {ORDER_STATUS_LABEL[step.status]}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {step.caption}
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </Card>
      )}

      <SectionHeader title="Items" />
      <Card style={styles.receipt}>
        {(items.data ?? []).map((item) => (
          <View key={item.id} style={styles.row}>
            <ThemedText type="small" style={styles.rowName}>
              <ThemedText type="smallBold">{item.quantity}×</ThemedText> {item.name_snapshot}
            </ThemedText>
            <ThemedText type="small">{formatCents(item.line_total_cents)}</ThemedText>
          </View>
        ))}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.row}>
          <ThemedText type="smallBold">Total</ThemedText>
          <ThemedText type="section">{formatCents(order.data.total_cents)}</ThemedText>
        </View>
      </Card>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  codeCard: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  code: {
    letterSpacing: 8,
  },
  cancelled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  timeline: {
    gap: 0,
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  rail: {
    alignItems: 'center',
    width: 32,
  },
  node: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 16,
    marginVertical: 2,
  },
  stepTexts: {
    flex: 1,
    gap: 2,
    paddingBottom: Spacing.three,
    paddingTop: 5,
  },
  receipt: {
    gap: Spacing.two + Spacing.one,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rowName: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
