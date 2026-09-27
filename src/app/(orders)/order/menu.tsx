import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { Spacing } from '@/constants/theme';
import { useMenu } from '@/hooks/useMenu';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { useCartStore, cartSubtotalCents } from '@/state/cartStore';
import { formatCents } from '@/utils/orderFormat';

/**
 * Order flow, step 2: "Pop-up menu" / "At Mongmo café" — available until
 * sold out. Tapping a card opens the item for a description + quantity;
 * the + button adds one straight from the list.
 */
export default function OrderMenuScreen() {
  const theme = useTheme();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const location = useCartStore((state) => state.location);
  const items = useCartStore((state) => state.items);
  const menuQuery = useMenu(location);

  // Only while this screen is on top. The order flow keeps it mounted under
  // cart → pickup → checkout, and placing an order clears the cart: a plain
  // effect would fire then and replace the confirmation with the location
  // picker.
  useFocusEffect(
    useCallback(() => {
      if (!location) router.replace('/(orders)/order/location');
    }, [location, router]),
  );

  if (!location) return null;

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          // With a footer the footer clears the tab bar; without one the list must.
          { paddingBottom: items.length > 0 ? Spacing.four : tabBarInset + Spacing.four },
        ]}
      >
        <View style={styles.heading}>
          <Chip
            label={location.type === 'store' ? 'At Mongmo café' : 'Pop-up menu'}
            tone={location.type === 'store' ? 'neutral' : 'live'}
            icon={location.type === 'store' ? 'store' : undefined}
          />
          <ThemedText type="title">
            {location.type === 'store' ? 'Coffee & pastries' : location.eventTitle}
          </ThemedText>
        </View>

        {menuQuery.isPending ? (
          <ActivityIndicator size="small" color={theme.text} style={styles.loader} />
        ) : menuQuery.isError ? (
          <ThemedText type="small" themeColor="textSecondary">
            Couldn&apos;t load the menu. Try again shortly.
          </ThemedText>
        ) : (menuQuery.data ?? []).length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Nothing available right now — check back soon.
          </ThemedText>
        ) : (
          (menuQuery.data ?? []).map((item) => {
            const inCart = items.find((line) => line.menuItemId === item.id)?.quantity ?? 0;
            return (
              // The card is not itself a button: the text opens the item and
              // the + adds one, as two sibling controls (never nested).
              <Card key={item.id} style={styles.row}>
                <Pressable
                  onPress={() => {
                    haptics.tap();
                    router.push({ pathname: '/(orders)/order/item/[id]', params: { id: item.id } });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}, ${formatCents(item.priceCents)}. Open item.`}
                  style={({ pressed }) => [styles.rowTexts, { opacity: pressed ? 0.6 : 1 }]}
                >
                  <ThemedText type="section">{item.name}</ThemedText>
                  {item.description ? (
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                      {item.description}
                    </ThemedText>
                  ) : null}
                  <View style={styles.priceRow}>
                    <ThemedText type="smallBold">{formatCents(item.priceCents)}</ThemedText>
                    {inCart > 0 ? <Chip label={`${inCart} in cart`} tone="info" /> : null}
                  </View>
                </Pressable>
                <IconButton
                  icon="add"
                  tone="primary"
                  size={44}
                  haptic="press"
                  onPress={() =>
                    useCartStore.getState().addItem({
                      menuItemId: item.id,
                      name: item.name,
                      priceCents: item.priceCents,
                    })
                  }
                  accessibilityLabel={`Add ${item.name} to cart`}
                />
              </Card>
            );
          })
        )}
      </ScrollView>

      {items.length > 0 ? (
        <ScreenFooter>
          <Button
            label={`View cart · ${itemCount} · ${formatCents(cartSubtotalCents(items))}`}
            accessibilityLabel={`View cart, ${items.length} item${items.length === 1 ? '' : 's'}, ${formatCents(cartSubtotalCents(items))}`}
            variant="brand"
            icon="bag"
            arrow
            onPress={() => router.push('/(orders)/order/cart')}
          />
        </ScreenFooter>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three + Spacing.one,
    gap: Spacing.two + Spacing.one,
  },
  heading: {
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  loader: {
    marginVertical: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rowTexts: {
    flex: 1,
    gap: Spacing.one,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});
