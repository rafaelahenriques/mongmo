import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Plus, ShoppingBag } from 'lucide-react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { Spacing } from '@/constants/theme';
import { useMenu } from '@/hooks/useMenu';
import { useTheme } from '@/hooks/useTheme';
import { useCartStore, cartSubtotalCents } from '@/state/cartStore';
import { formatCents } from '@/utils/orderFormat';

/**
 * Order flow, step 2: "Pop-up menu" / "At Mongmo café" — available until
 * sold out. Tapping a row opens the item for a description + quantity;
 * the + button adds one straight from the list.
 */
export default function OrderMenuScreen() {
  const theme = useTheme();
  const router = useRouter();
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="section" style={styles.heading}>
          {location.type === 'store' ? 'Vietnamese coffee and pastries' : `${location.eventTitle} — pop-up menu`}
        </ThemedText>

        {menuQuery.isPending ? (
          <ActivityIndicator size="small" color={theme.text} style={styles.loader} />
        ) : menuQuery.isError ? (
          <ThemedText type="small" themeColor="textSecondary">
            Couldn&apos;t load the menu. Pull to refresh or try again shortly.
          </ThemedText>
        ) : (menuQuery.data ?? []).length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Nothing available right now — check back soon.
          </ThemedText>
        ) : (
          (menuQuery.data ?? []).map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push({ pathname: '/(orders)/order/item/[id]', params: { id: item.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${formatCents(item.priceCents)}. Open item.`}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                  boxShadow: pressed ? undefined : `3px 3px 0px ${theme.shadow}`,
                  transform: pressed ? [{ translateX: 3 }, { translateY: 3 }] : [],
                },
              ]}
            >
              <View style={styles.rowTexts}>
                <ThemedText type="smallBold">{item.name}</ThemedText>
                {item.description ? (
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                    {item.description}
                  </ThemedText>
                ) : null}
                <ThemedText type="smallBold" themeColor="primaryText">
                  {formatCents(item.priceCents)}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => {
                  useCartStore.getState().addItem({
                    menuItemId: item.id,
                    name: item.name,
                    priceCents: item.priceCents,
                  });
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Add ${item.name} to cart`}
                hitSlop={8}
                style={[styles.addButton, { backgroundColor: theme.primary, borderColor: theme.border }]}
              >
                <Plus size={20} color={theme.onPrimary} strokeWidth={3} />
              </Pressable>
            </Pressable>
          ))
        )}
      </ScrollView>

      {items.length > 0 ? (
        <ScreenFooter>
          <Button
            label={`View cart · ${items.length} · ${formatCents(cartSubtotalCents(items))}`}
            accessibilityLabel={`View cart, ${items.length} item${items.length === 1 ? '' : 's'}, ${formatCents(cartSubtotalCents(items))}`}
            icon={<ShoppingBag size={20} color={theme.onPrimary} />}
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
    padding: Spacing.three,
    gap: Spacing.two,
  },
  heading: {
    marginBottom: Spacing.one,
  },
  loader: {
    marginVertical: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 14,
    borderWidth: 2,
    padding: Spacing.three,
    marginRight: 3,
    marginBottom: Spacing.one,
  },
  rowTexts: {
    flex: 1,
    gap: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
