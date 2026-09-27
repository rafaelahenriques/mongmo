import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Plus } from 'lucide-react-native';

import { ThemedText } from '@/components/ThemedText';
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

  useEffect(() => {
    if (!location) router.replace('/(orders)/order/location');
  }, [location, router]);

  if (!location) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="smallBold" style={styles.heading}>
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
                { borderColor: theme.backgroundSelected, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View style={styles.rowTexts}>
                <ThemedText type="smallBold">{item.name}</ThemedText>
                {item.description ? (
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                    {item.description}
                  </ThemedText>
                ) : null}
                <ThemedText type="small" themeColor="textSecondary">
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
                style={[styles.addButton, { backgroundColor: theme.backgroundSelected }]}
              >
                <Plus size={18} color={theme.text} />
              </Pressable>
            </Pressable>
          ))
        )}
      </ScrollView>

      {items.length > 0 ? (
        <Pressable
          onPress={() => router.push('/(orders)/order/cart')}
          accessibilityRole="button"
          accessibilityLabel={`View cart, ${items.length} item${items.length === 1 ? '' : 's'}, ${formatCents(cartSubtotalCents(items))}`}
          style={({ pressed }) => [styles.cartBar, { backgroundColor: '#8B4513', opacity: pressed ? 0.9 : 1 }]}
        >
          <ThemedText type="smallBold" style={styles.cartBarText}>
            View cart · {items.length} · {formatCents(cartSubtotalCents(items))}
          </ThemedText>
        </Pressable>
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
    paddingBottom: Spacing.six,
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
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
  rowTexts: {
    flex: 1,
    gap: 2,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBar: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: Spacing.three,
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBarText: {
    color: '#FFFFFF',
  },
});
