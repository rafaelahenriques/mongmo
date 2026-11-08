import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import type { OrderMenuItem } from '@/api/orders';
import { CategoryIcon } from '@/components/order/CategoryIcon';
import { ThemedText } from '@/components/ThemedText';
import { Icon } from '@/components/ui/Icon';
import { PRODUCT_PHOTO_POSITION, productPhoto } from '@/constants/productPhotos';
import { CardShadow, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { nameFromContent } from '@/utils/a11y';
import { formatCents, shortItemName } from '@/utils/orderFormat';

/**
 * A product as a rounded card: its photo in a rounded frame (or the
 * section's sticker until there's a photo), the name, what's in it, and the
 * price big beside a round sage "+". The section grid and "You may also like".
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
        <ThemedText type="card" numberOfLines={2}>
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
          <View style={[styles.add, { backgroundColor: theme.brandFill }]}>
            <Icon name="add" size={18} color={theme.onBrand} weight="bold" />
          </View>
        </View>
      </View>
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
