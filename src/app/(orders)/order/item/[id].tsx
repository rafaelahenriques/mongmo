import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Minus, Plus } from 'lucide-react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
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
      <ThemedText type="section" themeColor="primaryText">
        {formatCents(item.priceCents)}
      </ThemedText>

      <View style={styles.stepper}>
        <Pressable
          onPress={() => setQuantity((current) => Math.max(1, current - 1))}
          accessibilityRole="button"
          accessibilityLabel="Decrease quantity"
          style={[styles.stepButton, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
        >
          <Minus size={18} color={theme.text} />
        </Pressable>
        <ThemedText type="subtitle" style={styles.quantity}>
          {quantity}
        </ThemedText>
        <Pressable
          onPress={() => setQuantity((current) => current + 1)}
          accessibilityRole="button"
          accessibilityLabel="Increase quantity"
          style={[styles.stepButton, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
        >
          <Plus size={18} color={theme.text} />
        </Pressable>
      </View>

      <Button
        label={`Add to cart · ${formatCents(item.priceCents * quantity)}`}
        accessibilityLabel={`Add ${quantity} ${item.name} to cart, ${formatCents(item.priceCents * quantity)}`}
        onPress={onAdd}
        style={styles.addButton}
      />
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
    fontSize: 36,
    lineHeight: 38,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    minWidth: 28,
    textAlign: 'center',
  },
  addButton: {
    marginTop: Spacing.four,
  },
});
