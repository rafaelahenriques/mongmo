import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { CategoryIcon } from '@/components/order/CategoryIcon';
import { sectionsOf } from '@/components/order/MenuScreen';
import { ProductCard } from '@/components/order/ProductCard';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { TopBar } from '@/components/ui/TopBar';
import { PageInset } from '@/constants/theme';
import { useMenu } from '@/hooks/useMenu';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { cartSubtotalCents, useCartStore } from '@/state/cartStore';
import { formatCents } from '@/utils/orderFormat';

/**
 * One section of the menu ("Bánh mì"): its products as cards, two by two.
 * A card opens the product, to pick its options and how many.
 */
export default function CategoryScreen({ name }: { name: string }) {
  const theme = useTheme();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const location = useCartStore((state) => state.location);
  const items = useCartStore((state) => state.items);
  const menu = useMenu(location);
  const section = sectionsOf((menu.data ?? []).filter((item) => !item.addOnFor)).find(
    (candidate) => candidate.name.toLowerCase() === name.toLowerCase(),
  );
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(orders)'));

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <TopBar title="Menu" onBack={back} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: (count ? 88 : 24) + tabBarInset }]}>
        <View style={styles.head}>
          <CategoryIcon section={name} size={34} />
          <ThemedText type="title" accessibilityRole="header" style={styles.flex}>
            {section?.name ?? name}
          </ThemedText>
        </View>
        {menu.isPending ? (
          <ActivityIndicator color={theme.text} style={styles.loader} />
        ) : !section ? (
          <ThemedText type="caption" themeColor="textSecondary">
            Nothing here right now.
          </ThemedText>
        ) : (
          <View style={styles.grid}>
            {section.items.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                style={styles.cell}
                onPress={() => router.push({ pathname: '/(orders)/order/item/[id]', params: { id: item.id } })}
              />
            ))}
          </View>
        )}
      </ScrollView>
      {count ? (
        <View style={[styles.footer, { bottom: tabBarInset + 12 }]}>
          <Button
            label={`View cart · ${count} ${count === 1 ? 'item' : 'items'} · ${formatCents(cartSubtotalCents(items))}`}
            variant="brand"
            onPress={() => router.push('/(orders)/order/cart')}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: PageInset,
    paddingTop: 4,
    gap: 16,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loader: {
    marginVertical: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    width: '47.5%',
    flexGrow: 1,
    maxWidth: '50%',
  },
  footer: {
    position: 'absolute',
    left: PageInset,
    right: PageInset,
  },
});
