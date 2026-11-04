import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { BlockButton } from '@/components/ui/BlockButton';
import { Icon } from '@/components/ui/Icon';
import { SquareIconButton } from '@/components/ui/SquareIconButton';
import { Stepper } from '@/components/ui/Stepper';
import { PageInset } from '@/constants/theme';
import { useMenu } from '@/hooks/useMenu';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { useCartStore } from '@/state/cartStore';
import { formatCents } from '@/utils/orderFormat';

/**
 * O-02 Item: the photo, the name big in uppercase with its price, what's
 * in it, how many, and ADD TO ORDER with the total at the bottom.
 */
export default function ItemScreen({ itemId }: { itemId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const location = useCartStore((state) => state.location);
  const menu = useMenu(location);
  const [quantity, setQuantity] = useState(1);
  const item = menu.data?.find((row) => row.id === itemId);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(orders)'));

  if (!item) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        {menu.isPending ? (
          <ActivityIndicator color={theme.text} />
        ) : (
          <>
            <ThemedText type="section">This isn’t on the menu</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              It may have sold out.
            </ThemedText>
          </>
        )}
        <View style={[styles.back, { top: insets.top + 10 }]}>
          <SquareIconButton icon="chevronLeft" onPress={back} accessibilityLabel="Back" />
        </View>
      </View>
    );
  }

  const onAdd = () => {
    const cart = useCartStore.getState();
    const inCart = cart.items.find((line) => line.menuItemId === item.id)?.quantity ?? 0;
    if (inCart) cart.setQuantity(item.id, inCart + quantity);
    else {
      cart.addItem({ menuItemId: item.id, name: item.name, priceCents: item.priceCents });
      if (quantity > 1) cart.setQuantity(item.id, quantity);
    }
    haptics.success();
    back();
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.photo, { height: 220 + insets.top, backgroundColor: theme.backgroundSelected }]}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <Icon name="food" size={48} color={theme.border} />
          )}
          <View style={[styles.back, { top: insets.top + 10 }]}>
            <SquareIconButton icon="chevronLeft" onPress={back} accessibilityLabel="Back" />
          </View>
        </View>

        <View style={styles.page}>
          <View style={styles.title}>
            <ThemedText type="item" accessibilityRole="header" style={styles.flex}>
              {item.name.toUpperCase()}
            </ThemedText>
            <ThemedText type="item">{formatCents(item.priceCents)}</ThemedText>
          </View>
          {item.description ? (
            <ThemedText type="default" themeColor="textSecondary">
              {item.description}
            </ThemedText>
          ) : null}
          <View style={[styles.row, { borderColor: theme.border }]}>
            <ThemedText type="smallBold" style={styles.flex}>
              Quantity
            </ThemedText>
            <Stepper value={quantity} onChange={setQuantity} min={1} max={20} label={item.name} />
          </View>
        </View>
      </ScrollView>
      <BlockButton label="Add to order" value={formatCents(item.priceCents * quantity)} onPress={onAdd} bottomInset />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  scroll: {
    paddingBottom: 24,
  },
  photo: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  back: {
    position: 'absolute',
    left: PageInset,
  },
  page: {
    paddingHorizontal: PageInset,
    paddingTop: 18,
    gap: 10,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 12,
    marginTop: 10,
  },
});
