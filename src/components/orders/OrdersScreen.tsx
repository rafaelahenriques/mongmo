import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { IconBadge } from '@/components/ui/IconBadge';
import { ListRow } from '@/components/ui/ListRow';
import { LargeHeader, ScreenScroll, SectionHeader } from '@/components/ui/Screen';
import { Spacing } from '@/constants/theme';
import { useMyOrders } from '@/hooks/useMyOrders';
import { useTheme } from '@/hooks/useTheme';
import { useCartStore, cartSubtotalCents } from '@/state/cartStore';
import { formatCents, ORDER_STATUS_LABEL } from '@/utils/orderFormat';
import type { OrderStatus } from '@/types/database';

const ACTIVE_STATUSES: OrderStatus[] = ['paid', 'preparing', 'ready'];

/**
 * Orders tab: cart-in-progress (if any), active orders, order history, and
 * the entry point into the order flow (location → menu → cart → checkout).
 */
export default function OrdersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const location = useCartStore((state) => state.location);
  const ordersQuery = useMyOrders();

  const startOrder = useCallback(() => router.push('/(orders)/order/location'), [router]);
  const resumeCart = useCallback(() => router.push('/(orders)/order/cart'), [router]);
  const openStatus = useCallback(
    (id: string) => router.push({ pathname: '/(orders)/order/status/[id]', params: { id } }),
    [router],
  );

  const orders = ordersQuery.data ?? [];
  const activeOrders = orders.filter((order) => ACTIVE_STATUSES.includes(order.status));
  const pastOrders = orders.filter((order) => !ACTIVE_STATUSES.includes(order.status));
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <ScreenScroll topInset>
      <LargeHeader eyebrow="Pickup only" title="Orders" />

      {items.length > 0 ? (
        <Card
          tone="brand"
          onPress={resumeCart}
          accessibilityLabel={`Resume cart, ${items.length} item${items.length === 1 ? '' : 's'}, ${formatCents(cartSubtotalCents(items))}`}
          style={styles.row}
        >
          <IconBadge name="bag" tone="card" size={48} />
          <View style={styles.cardTexts}>
            <ThemedText type="section" style={{ color: theme.onBrand }}>
              Your cart · {itemCount}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.onBrand }} numberOfLines={1}>
              {location?.type === 'event' ? location.eventTitle : 'Mongmo café'} · {formatCents(cartSubtotalCents(items))}
            </ThemedText>
          </View>
          <Icon name="arrowRight" size={20} color={theme.onBrand} weight="bold" />
        </Card>
      ) : null}

      {activeOrders.map((order) => (
        <Card
          key={order.id}
          tone="primary"
          onPress={() => openStatus(order.id)}
          accessibilityLabel={`Order ${ORDER_STATUS_LABEL[order.status]}, ${formatCents(order.total_cents)}`}
          style={styles.row}
        >
          <IconBadge name="takeout" tone="accent" size={48} />
          <View style={styles.cardTexts}>
            <ThemedText type="section" style={{ color: theme.onPrimary }}>
              {ORDER_STATUS_LABEL[order.status]}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.onPrimary, opacity: 0.8 }}>
              {formatCents(order.total_cents)} · tap for your pickup code
            </ThemedText>
          </View>
          <Icon name="arrowRight" size={20} color={theme.onPrimary} weight="bold" />
        </Card>
      ))}

      <Button label="Start an order" accessibilityLabel="Start a new order" icon="add" arrow onPress={startOrder} />

      <SectionHeader title="History" />

      {ordersQuery.isPending ? (
        <ActivityIndicator size="small" color={theme.text} style={styles.loader} />
      ) : pastOrders.length === 0 ? (
        <Card tone="muted" style={styles.empty}>
          <Icon name="receipt" size={22} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.cardTexts}>
            No past orders yet — your first one will show up here.
          </ThemedText>
        </Card>
      ) : (
        <Card style={styles.history}>
          {pastOrders.map((order, index) => (
            <View key={order.id}>
              {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
              <ListRow
                title={new Date(order.created_at).toLocaleDateString(undefined, {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
                subtitle={formatCents(order.total_cents)}
                icon="receipt"
                trailing={
                  <Chip
                    label={ORDER_STATUS_LABEL[order.status]}
                    tone={order.status === 'cancelled' ? 'danger' : 'neutral'}
                  />
                }
                onPress={() => openStatus(order.id)}
                accessibilityLabel={`Past order, ${ORDER_STATUS_LABEL[order.status]}, ${formatCents(order.total_cents)}`}
              />
            </View>
          ))}
        </Card>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  cardTexts: {
    flex: 1,
    gap: 2,
  },
  loader: {
    marginVertical: Spacing.four,
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  history: {
    paddingVertical: Spacing.two,
    gap: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 40 + Spacing.three,
  },
});
