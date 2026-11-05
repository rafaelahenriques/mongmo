import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import type { OrderMenuItem } from '@/api/orders';
import { CategoryIcon } from '@/components/order/CategoryIcon';
import { ThemedText } from '@/components/ThemedText';
import { PRODUCT_PHOTO_POSITION, productPhoto } from '@/constants/productPhotos';
import { CardShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { nameFromContent } from '@/utils/a11y';
import { formatCents, shortItemName } from '@/utils/orderFormat';

/**
 * A product as a card: its photo round on a pale square (or the section's
 * drawing until there's a photo), the name in uppercase, what's in it and
 * the price. The section grid and "You may also like".
 */
export function ProductCard({
  item,
  withSection = false,
  onPress,
  style,
}: {
  item: OrderMenuItem;
  /** Away from its section ("You may also like"): say which, over the name. */
  withSection?: boolean;
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
        `${item.name}, ${formatCents(item.priceCents)} euro${item.description ? `. ${item.description}` : ''}`,
      )}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, boxShadow: CardShadow, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <View style={[styles.photoBox, { backgroundColor: theme.backgroundSelected }]}>
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
            <CategoryIcon section={item.category ?? item.name} size={46} />
          </View>
        )}
      </View>
      <View style={styles.texts}>
        {section ? (
          <ThemedText type="micro" themeColor="textSecondary">
            {section.toUpperCase()}
          </ThemedText>
        ) : null}
        <ThemedText type="card" numberOfLines={2}>
          {name}
        </ThemedText>
        {item.description ? (
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
            {item.description}
          </ThemedText>
        ) : null}
        <ThemedText type="captionBold" style={styles.price}>
          {formatCents(item.priceCents)}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  photoBox: {
    aspectRatio: 1.15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plate: {
    width: '62%',
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 4,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
  },
  price: {
    marginTop: 'auto',
    paddingTop: 4,
  },
});
