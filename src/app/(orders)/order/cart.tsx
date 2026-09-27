import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { IconBadge } from '@/components/ui/IconBadge';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { Stepper } from '@/components/ui/Stepper';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
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
        <IconBadge name="bag" size={64} />
        <ThemedText type="subtitle">Your cart is empty</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          Add something from the menu first.
        </ThemedText>
        <Button
          label="Back to menu"
          variant="secondary"
          size="medium"
          onPress={() => router.push('/(orders)/order/menu')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Chip
          label={location?.type === 'event' ? `Pickup at the truck · ${location.eventTitle}` : 'Pickup at Mongmo café'}
          icon={location?.type === 'event' ? 'takeout' : 'store'}
        />

        <Card style={styles.list}>
          {items.map((item, index) => (
            <View key={item.menuItemId}>
              {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
              <View style={styles.row}>
                <View style={styles.rowTexts}>
                  <ThemedText type="smallBold">{item.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatCents(item.priceCents * item.quantity)}
                  </ThemedText>
                </View>
                <Stepper
                  value={item.quantity}
                  onChange={(quantity) => setQuantity(item.menuItemId, quantity)}
                  label={`${item.name} quantity`}
                />
                <IconButton
                  icon="trash"
                  tone="muted"
                  size={34}
                  onPress={() => {
                    haptics.warning();
                    removeItem(item.menuItemId);
                  }}
                  accessibilityLabel={`Remove ${item.name} from cart`}
                />
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>

      <ScreenFooter>
        <View style={styles.subtotalRow}>
          <ThemedText type="small" themeColor="textSecondary">
            Subtotal
          </ThemedText>
          <ThemedText type="subtitle">{formatCents(cartSubtotalCents(items))}</ThemedText>
        </View>
        <Button
          label="Continue"
          accessibilityLabel="Continue to pickup time"
          variant="brand"
          arrow
          onPress={() => router.push('/(orders)/order/pickup-time')}
        />
      </ScreenFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three + Spacing.one,
    gap: Spacing.three,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  center: {
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  list: {
    paddingVertical: Spacing.two,
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two + Spacing.one,
  },
  rowTexts: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
});
