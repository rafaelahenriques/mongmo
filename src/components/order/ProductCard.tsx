import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import type { OrderMenuItem } from '@/api/orders';
import { CategoryIcon } from '@/components/order/CategoryIcon';
import { ThemedText } from '@/components/ThemedText';
import Chip from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { PRODUCT_PHOTO_POSITION, productPhoto } from '@/constants/productPhotos';
import { CardShadow, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { nameFromContent } from '@/utils/a11y';
import type { StockNote } from '@/utils/dishStock';
import { formatCents, shortItemName } from '@/utils/orderFormat';

/**
 * A product as a rounded card: its photo in a rounded frame (or the
 * section's sticker until there's a photo), the name, what's in it, and the
 * price big beside a round sage "+". The section grid and "You may also like".
 * When few are left, it says so on the photo ("Hurry, only 4 left"); sold
 * out, the photo dims and the "+" goes.
 */
export function ProductCard({
  item,
  withSection = false,
  stock = null,
  onPress,
  style,
}: {
  item: OrderMenuItem;
  /** Away from its section ("You may also like"): say which, over the name. */
  withSection?: boolean;
  /** How many are left, when that's worth saying. */
  stock?: StockNote | null;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const name = shortItemName(item.name, item.category);
  const photo = productPhoto(item);
  const section = withSection && name !== item.name ? item.category : null;
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      {...nameFromContent(
        `${item.name}, ${formatCents(item.priceCents)} euro${stock ? `. ${stock.label}` : ''}${item.description ? `. ${item.description}` : ''}`,
      )}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, boxShadow: CardShadow, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <View style={[styles.photoBox, { backgroundColor: theme.backgroundSelected }, stock?.soldOut && styles.soldOut]}>
        {photo ? (
          <Image
            accessible={false}
            accessibilityLabel=""
            source={photo}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition={PRODUCT_PHOTO_POSITION}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[styles.plate, { backgroundColor: theme.backgroundElement }]}>
            <CategoryIcon section={item.category ?? item.name} size={72} />
          </View>
        )}
      </View>
      <View style={styles.texts}>
        {section ? (
          <ThemedText type="label" themeColor="textSecondary">
            {section}
          </ThemedText>
        ) : null}
        <ThemedText type="smallBold" numberOfLines={2}>
          {name}
        </ThemedText>
        {item.description ? (
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
            {item.description}
          </ThemedText>
        ) : null}
        <View style={styles.foot}>
          <ThemedText type="section">{formatCents(item.priceCents)}</ThemedText>
          {/* Says "add": the whole card is the button. */}
          {stock?.soldOut ? null : (
            <View style={[styles.add, { backgroundColor: theme.brandFill }]}>
              <Icon name="add" size={18} color={theme.onBrand} weight="bold" />
            </View>
          )}
        </View>
      </View>
      {/* On the photo's corner, not in it: the photo dims when sold out, the
          label doesn't. Last, so the card's name starts with the dish. */}
      {stock ? (
        <Chip label={stock.label} tone={stock.soldOut ? 'dark' : 'warning'} lines={2} style={styles.stock} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: Radius.card,
    padding: 8,
  },
  photoBox: {
    aspectRatio: 1.15,
    borderRadius: Radius.large,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOut: {
    opacity: 0.45,
  },
  stock: {
    position: 'absolute',
    top: 16,
    left: 16,
    maxWidth: '85%',
    // Two lines look like a tag, not a stretched pill.
    borderRadius: Radius.medium,
  },
  plate: {
    width: '70%',
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 4,
    paddingHorizontal: 6,
    paddingTop: 10,
    paddingBottom: 4,
  },
  foot: {
    marginTop: 'auto',
    paddingTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  add: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
