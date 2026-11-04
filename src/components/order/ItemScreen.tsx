import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryIcon } from '@/components/order/CategoryIcon';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { SquareIconButton } from '@/components/ui/SquareIconButton';
import { OptionPill } from '@/components/ui/OptionPill';
import { Segmented } from '@/components/ui/Segmented';
import { Stepper } from '@/components/ui/Stepper';
import { PRODUCT_PHOTO_POSITION, productPhoto } from '@/constants/productPhotos';
import { PageInset } from '@/constants/theme';
import { useMenu } from '@/hooks/useMenu';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import type { OrderMenuItem } from '@/api/orders';
import { useCartStore, type CartOption } from '@/state/cartStore';
import { formatCents, shortItemName } from '@/utils/orderFormat';
import { useMotion } from '@/constants/motion';

/**
 * O-02 Item: the photo, the name big in uppercase with its price, what's
 * in it, how many, and ADD TO ORDER with the total at the bottom.
 */
export default function ItemScreen({ itemId }: { itemId: string }) {
  const theme = useTheme();
  const motion = useMotion();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const location = useCartStore((state) => state.location);
  const menu = useMenu(location);
  const [quantity, setQuantity] = useState(1);
  /** Chosen option per choice group (the dip), by group; none means its first one. */
  const [choices, setChoices] = useState<Record<string, string>>({});
  /** Extras switched on (extra protein). */
  const [extras, setExtras] = useState<string[]>([]);
  const item = menu.data?.find((row) => row.id === itemId);
  const groups = useMemo(() => optionGroupsFor(item, menu.data ?? []), [item, menu.data]);

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
          <SquareIconButton icon="chevronLeft" onPress={back} accessibilityLabel="Back" size={44} />
        </View>
      </View>
    );
  }

  const short = shortItemName(item.name, item.category);
  const photo = productPhoto(item);
  const chosen: CartOption[] = groups
    .flatMap((group) =>
      group.choice
        ? group.items.filter((option) => option.id === (choices[group.name] ?? group.items[0]?.id))
        : group.items.filter((option) => extras.includes(option.id)),
    )
    .map((option) => ({ id: option.id, name: option.name, priceCents: option.priceCents }));
  const unit = item.priceCents + chosen.reduce((sum, option) => sum + option.priceCents, 0);

  const onAdd = () => {
    useCartStore
      .getState()
      .addItem({ menuItemId: item.id, name: item.name, priceCents: item.priceCents, options: chosen }, quantity);
    haptics.success();
    back();
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <View style={[styles.photo, { height: 220 + insets.top, backgroundColor: theme.backgroundSelected }]}>
          {photo ? (
            <Image
              accessible={false}
              accessibilityLabel=""
              source={photo}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              contentPosition={PRODUCT_PHOTO_POSITION}
              transition={motion.imageFadeMs}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={[styles.plate, { backgroundColor: theme.backgroundElement }]}>
              <CategoryIcon section={item.category ?? item.name} size={72} />
            </View>
          )}
          <View style={[styles.back, { top: insets.top + 10 }]}>
            <SquareIconButton icon="chevronLeft" onPress={back} accessibilityLabel="Back" size={44} />
          </View>
        </View>

        <View style={styles.page}>
          <View style={styles.title}>
            <ThemedText
              type="item"
              accessibilityRole="header"
              headingLevel={1}
              accessibilityLabel={item.name}
              style={styles.flex}
            >
              {(short !== item.name && item.category ? item.category : item.name).toUpperCase()}
            </ThemedText>
            <ThemedText type="item">{formatCents(item.priceCents)}</ThemedText>
          </View>
          {short !== item.name ? <ThemedText type="section">{short}</ThemedText> : null}
          {item.description ? (
            <ThemedText type="default" themeColor="textSecondary">
              {item.description}
            </ThemedText>
          ) : null}
          {groups.map((group) =>
            group.choice ? (
              <View key={group.name} style={styles.group}>
                <ThemedText type="section" accessibilityRole="header">
                  {group.name}
                </ThemedText>
                <Segmented
                  look="blocks"
                  accessibilityLabel={group.name}
                  value={choices[group.name] ?? group.items[0]!.id}
                  onChange={(id) => setChoices((current) => ({ ...current, [group.name]: id }))}
                  options={group.items.map((option) => ({
                    value: option.id,
                    label: shortItemName(option.name, group.name).replace(/ dip$/i, ''),
                  }))}
                />
              </View>
            ) : (
              group.items.map((option) => {
                const on = extras.includes(option.id);
                return (
                  <View key={option.id} style={[styles.row, { borderColor: theme.border }]}>
                    <View style={styles.flex}>
                      <ThemedText type="smallBold">{option.name}</ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary">
                        {formatCents(option.priceCents)} extra
                      </ThemedText>
                    </View>
                    <OptionPill
                      label={on ? 'Added' : 'Add'}
                      checked={on}
                      toggle
                      accessibilityLabel={`${option.name}, ${formatCents(option.priceCents)} extra`}
                      onPress={() =>
                        setExtras((current) =>
                          on ? current.filter((id) => id !== option.id) : [...current, option.id],
                        )
                      }
                    />
                  </View>
                );
              })
            ),
          )}
          <View style={[styles.row, { borderColor: theme.border }]}>
            <ThemedText type="smallBold" style={styles.flex}>
              Quantity
            </ThemedText>
            <Stepper value={quantity} onChange={setQuantity} min={1} max={20} label={item.name} />
          </View>
          <Button
            label={`Add to cart · ${formatCents(unit * quantity)}`}
            accessibilityLabel={`Add ${quantity} to cart, ${formatCents(unit * quantity)} euro`}
            variant="brand"
            icon="bag"
            haptic="press"
            onPress={onAdd}
            style={styles.add}
          />
        </View>
      </ScrollView>
    </View>
  );
}

type OptionGroup = {
  name: string;
  /** Pick one (all free: the dip), or switch each on (extras). */
  choice: boolean;
  items: OrderMenuItem[];
};

/** The options that go with an item, grouped by their section ("Choose your dip", "Extras"). */
function optionGroupsFor(item: OrderMenuItem | undefined, menu: OrderMenuItem[]): OptionGroup[] {
  if (!item?.category) return [];
  const groups: OptionGroup[] = [];
  for (const option of menu) {
    if (!option.addOnFor?.includes(item.category)) continue;
    const name = option.category?.trim() || 'Extras';
    const group = groups.find((candidate) => candidate.name === name);
    if (group) group.items.push(option);
    else groups.push({ name, choice: false, items: [option] });
  }
  for (const group of groups) group.choice = group.items.every((option) => option.priceCents === 0);
  // The choice (the dip) first, then extras.
  return groups.sort((a, b) => Number(b.choice) - Number(a.choice));
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
    paddingBottom: 40,
  },
  add: {
    marginTop: 18,
  },
  photo: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  plate: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
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
  group: {
    gap: 8,
    marginTop: 10,
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
