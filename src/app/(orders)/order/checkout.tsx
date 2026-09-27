import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Spacing } from '@/constants/theme';
import { usePlaceOrder } from '@/hooks/usePlaceOrder';
import { useTheme } from '@/hooks/useTheme';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useCartStore, cartSubtotalCents } from '@/state/cartStore';
import { formatCents } from '@/utils/orderFormat';

/**
 * Order flow, step 5: mock/test payment — clearly labelled as a prototype
 * per AGENTS.md. The server computes the real total; this screen only
 * shows the client's own subtotal estimate before that happens.
 */
export default function OrderCheckoutScreen() {
  const theme = useTheme();
  const router = useRouter();
  const location = useCartStore((state) => state.location);
  const items = useCartStore((state) => state.items);
  const pickupAt = useCartStore((state) => state.pickupAt);
  const placeOrder = usePlaceOrder();
  const tabBarInset = useTabBarInset();
  const [error, setError] = useState<string | null>(null);

  if (!location || items.length === 0) return null;

  const onPay = () => {
    setError(null);
    placeOrder.mutate(
      {
        location,
        items: items.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })),
        pickupAt,
      },
      {
        onSuccess: (order) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
          router.replace({ pathname: '/(orders)/order/confirmation', params: { id: order.id } });
        },
        onError: (mutationError) => {
          setError(mutationError instanceof Error ? mutationError.message : 'Something went wrong.');
        },
      },
    );
  };

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + Spacing.four }]}
    >
      <View style={[styles.prototypeBadge, { backgroundColor: theme.accent, borderColor: theme.border }]}>
        <ThemedText type="label" style={{ color: theme.onAccent }}>
          Prototype payment — no real card is charged
        </ThemedText>
      </View>

      {items.map((item) => (
        <View key={item.menuItemId} style={styles.row}>
          <ThemedText type="small">
            {item.quantity}× {item.name}
          </ThemedText>
          <ThemedText type="small">{formatCents(item.priceCents * item.quantity)}</ThemedText>
        </View>
      ))}

      <View style={[styles.row, styles.totalRow, { borderColor: theme.border }]}>
        <ThemedText type="section">Estimated total</ThemedText>
        <ThemedText type="section" themeColor="primaryText">
          {formatCents(cartSubtotalCents(items))}
        </ThemedText>
      </View>

      {error ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {error}
        </ThemedText>
      ) : null}

      <Button
        label="Place order"
        accessibilityLabel="Place order with prototype payment"
        onPress={onPay}
        loading={placeOrder.isPending}
        style={styles.button}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  prototypeBadge: {
    borderRadius: 10,
    borderWidth: 2,
    padding: Spacing.two,
    marginBottom: Spacing.two,
    alignItems: 'center',
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
  button: {
    marginTop: Spacing.four,
  },
});
