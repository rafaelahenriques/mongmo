import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useCartStore, cartSubtotalCents } from '@/state/cartStore';
import { formatCents } from '@/utils/orderFormat';

/** Order flow, step 3: review the cart before choosing a pickup time. */
export default function OrderCartScreen() {
  const theme = useTheme();
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const location = useCartStore((state) => state.location);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  if (items.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.background }]}>
        <ThemedText type="smallBold">Your cart is empty</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.emptyBody}>
          Add something from the menu first.
        </ThemedText>
        <Pressable
          onPress={() => router.push('/(orders)/order/menu')}
          accessibilityRole="button"
          accessibilityLabel="Back to menu"
          style={({ pressed }) => [styles.button, { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.8 : 1 }]}
        >
          <ThemedText type="smallBold">Back to menu</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="small" themeColor="textSecondary">
          {location?.type === 'event' ? `Pickup at the truck — ${location.eventTitle}` : 'Pickup at Mongmo café'}
        </ThemedText>

        {items.map((item) => (
          <View
            key={item.menuItemId}
            style={[styles.row, { borderColor: theme.backgroundSelected }]}
          >
            <View style={styles.rowTexts}>
              <ThemedText type="smallBold">{item.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatCents(item.priceCents)} each
              </ThemedText>
            </View>

            <View style={styles.stepper}>
              <Pressable
                onPress={() => setQuantity(item.menuItemId, item.quantity - 1)}
                accessibilityRole="button"
                accessibilityLabel={`Decrease quantity of ${item.name}`}
                style={[styles.stepButton, { backgroundColor: theme.backgroundSelected }]}
              >
                <Minus size={16} color={theme.text} />
              </Pressable>
              <ThemedText type="smallBold" style={styles.quantity}>
                {item.quantity}
              </ThemedText>
              <Pressable
                onPress={() => setQuantity(item.menuItemId, item.quantity + 1)}
                accessibilityRole="button"
                accessibilityLabel={`Increase quantity of ${item.name}`}
                style={[styles.stepButton, { backgroundColor: theme.backgroundSelected }]}
              >
                <Plus size={16} color={theme.text} />
              </Pressable>
              <Pressable
                onPress={() => removeItem(item.menuItemId)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.name} from cart`}
                hitSlop={8}
                style={styles.removeButton}
              >
                <Trash2 size={16} color={theme.danger} />
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { borderColor: theme.backgroundSelected }]}>
        <View style={styles.subtotalRow}>
          <ThemedText type="smallBold">Subtotal</ThemedText>
          <ThemedText type="smallBold">{formatCents(cartSubtotalCents(items))}</ThemedText>
        </View>
        <Pressable
          onPress={() => router.push('/(orders)/order/pickup-time')}
          accessibilityRole="button"
          accessibilityLabel="Continue to pickup time"
          style={({ pressed }) => [styles.button, { backgroundColor: '#8B4513', opacity: pressed ? 0.9 : 1 }]}
        >
          <ThemedText type="smallBold" style={styles.buttonText}>
            Continue
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  emptyBody: {
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  rowTexts: {
    flex: 1,
    gap: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    minWidth: 22,
    textAlign: 'center',
  },
  removeButton: {
    marginLeft: Spacing.two,
    padding: Spacing.one,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
  },
});
