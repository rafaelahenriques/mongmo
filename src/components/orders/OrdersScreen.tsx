import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ArrowRight, ShoppingBag } from 'lucide-react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useMyOrders } from '@/hooks/useMyOrders';
import { useTheme } from '@/hooks/useTheme';
import { useCartStore, cartSubtotalCents } from '@/state/cartStore';
import { formatCents, ORDER_STATUS_LABEL } from '@/utils/orderFormat';
import type { OrderStatus } from '@/types/database';

const STORE_BROWN = '#8B4513';
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

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {items.length > 0 ? (
        <Pressable
          onPress={resumeCart}
          accessibilityRole="button"
          accessibilityLabel={`Resume cart, ${items.length} item${items.length === 1 ? '' : 's'}, ${formatCents(cartSubtotalCents(items))}`}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <ShoppingBag size={20} color={theme.text} />
          <View style={styles.cardTexts}>
            <ThemedText type="smallBold">
              Cart · {items.length} item{items.length === 1 ? '' : 's'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {location?.type === 'event' ? location.eventTitle : 'Mongmo café'} ·{' '}
              {formatCents(cartSubtotalCents(items))}
            </ThemedText>
          </View>
          <ArrowRight size={18} color={theme.textSecondary} />
        </Pressable>
      ) : null}

      {activeOrders.map((order) => (
        <Pressable
          key={order.id}
          onPress={() => openStatus(order.id)}
          accessibilityRole="button"
          accessibilityLabel={`Order ${ORDER_STATUS_LABEL[order.status]}, ${formatCents(order.total_cents)}`}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={styles.cardTexts}>
            <ThemedText type="smallBold">{ORDER_STATUS_LABEL[order.status]}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatCents(order.total_cents)} · tap for pickup code
            </ThemedText>
          </View>
          <ArrowRight size={18} color={theme.textSecondary} />
        </Pressable>
      ))}

      <Pressable
        onPress={startOrder}
        accessibilityRole="button"
        accessibilityLabel="Start a new order"
        style={({ pressed }) => [styles.startButton, { backgroundColor: STORE_BROWN, opacity: pressed ? 0.9 : 1 }]}
      >
        <ThemedText type="smallBold" style={styles.startText}>
          Start an order
        </ThemedText>
      </Pressable>

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Order history
      </ThemedText>

      {ordersQuery.isPending ? (
        <ActivityIndicator size="small" color={theme.text} style={styles.loader} />
      ) : pastOrders.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No past orders yet — your first one will show up here.
        </ThemedText>
      ) : (
        pastOrders.map((order) => (
          <Pressable
            key={order.id}
            onPress={() => openStatus(order.id)}
            accessibilityRole="button"
            accessibilityLabel={`Past order, ${ORDER_STATUS_LABEL[order.status]}, ${formatCents(order.total_cents)}`}
            style={({ pressed }) => [
              styles.historyRow,
              { borderColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={styles.cardTexts}>
              <ThemedText type="small">{new Date(order.created_at).toLocaleDateString()}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {ORDER_STATUS_LABEL[order.status]}
              </ThemedText>
            </View>
            <ThemedText type="smallBold">{formatCents(order.total_cents)}</ThemedText>
          </Pressable>
        ))
      )}
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
    gap: Spacing.three,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
  cardTexts: {
    flex: 1,
    gap: 2,
  },
  startButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    marginTop: Spacing.two,
  },
  loader: {
    marginVertical: Spacing.four,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.two,
  },
});
