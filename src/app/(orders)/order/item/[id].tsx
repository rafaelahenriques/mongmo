import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Minus, Plus } from 'lucide-react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useMenu } from '@/hooks/useMenu';
import { useTheme } from '@/hooks/useTheme';
import { useCartStore } from '@/state/cartStore';
import { formatCents } from '@/utils/orderFormat';

/** Item detail: description, price, a quantity stepper, add to cart. */
export default function OrderItemScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const location = useCartStore((state) => state.location);
  const menuQuery = useMenu(location);
  const [quantity, setQuantity] = useState(1);

  const item = useMemo(
    () => menuQuery.data?.find((row) => row.id === id),
    [menuQuery.data, id],
  );

  if (menuQuery.isPending) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ThemedText type="smallBold">Item not found</ThemedText>
      </View>
    );
  }

  const onAdd = () => {
    const addOnce = useCartStore.getState().addItem;
    for (let index = 0; index < quantity; index += 1) {
      addOnce({ menuItemId: item.id, name: item.name, priceCents: item.priceCents });
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ThemedText type="title" style={styles.title}>
        {item.name}
      </ThemedText>
      {item.description ? (
        <ThemedText type="small" themeColor="textSecondary">
          {item.description}
        </ThemedText>
      ) : null}
      <ThemedText type="smallBold">{formatCents(item.priceCents)}</ThemedText>

      <View style={styles.stepper}>
        <Pressable
          onPress={() => setQuantity((current) => Math.max(1, current - 1))}
          accessibilityRole="button"
          accessibilityLabel="Decrease quantity"
          style={[styles.stepButton, { backgroundColor: theme.backgroundSelected }]}
        >
          <Minus size={18} color={theme.text} />
        </Pressable>
        <ThemedText type="smallBold" style={styles.quantity}>
          {quantity}
        </ThemedText>
        <Pressable
          onPress={() => setQuantity((current) => current + 1)}
          accessibilityRole="button"
          accessibilityLabel="Increase quantity"
          style={[styles.stepButton, { backgroundColor: theme.backgroundSelected }]}
        >
          <Plus size={18} color={theme.text} />
        </Pressable>
      </View>

      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel={`Add ${quantity} ${item.name} to cart, ${formatCents(item.priceCents * quantity)}`}
        style={({ pressed }) => [styles.addButton, { backgroundColor: '#8B4513', opacity: pressed ? 0.9 : 1 }]}
      >
        <ThemedText type="smallBold" style={styles.addText}>
          Add to cart · {formatCents(item.priceCents * quantity)}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    fontSize: 20,
    minWidth: 28,
    textAlign: 'center',
  },
  addButton: {
    marginTop: Spacing.four,
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    color: '#FFFFFF',
  },
});
