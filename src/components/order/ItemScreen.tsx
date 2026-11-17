import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AllergenInfo } from '@/components/order/AllergenInfo';
import { CategoryIcon } from '@/components/order/CategoryIcon';
import { GuestLock } from '@/components/guest/GuestLock';
import { JOIN } from '@/components/guest/joinCopy';
import { ThemedText } from '@/components/ThemedText';
import { BlockButton } from '@/components/ui/BlockButton';
import Chip from '@/components/ui/Chip';
import { SquareIconButton } from '@/components/ui/SquareIconButton';
import { OptionPill } from '@/components/ui/OptionPill';
import { Segmented } from '@/components/ui/Segmented';
import { Stepper } from '@/components/ui/Stepper';
import { PRODUCT_PHOTO_POSITION, productPhoto } from '@/constants/productPhotos';
import { PageInset, Radius } from '@/constants/theme';
import { useIsGuest } from '@/hooks/useIsGuest';
import { useMenu } from '@/hooks/useMenu';
import { useMenuStock } from '@/hooks/useMenuStock';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { useCartStore, type CartOption } from '@/state/cartStore';
import { optionGroupsFor } from '@/utils/itemOptions';
import { formatCents, shortItemName } from '@/utils/orderFormat';
import { useMotion } from '@/constants/motion';
import { ErrorState } from '@/components/ui/LoadState';

/** The most of one item a cart line takes at once. */
const MOST_AT_ONCE = 20;

/**
 * O-02 Item: the photo, the name big in uppercase with its price, what's
 * in it, how many, and ADD TO ORDER with the total at the bottom. When few
 * are left it says so. At a pop-up you can't add more than are left (none
 * when it's sold out); at the café the limit is per day, so it says which
 * day and checkout checks the day you pick.
 */
export default function ItemScreen({ itemId }: { itemId: string }) {
  const theme = useTheme();
  const guest = useIsGuest();
  const motion = useMotion();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const location = useCartStore((state) => state.location);
  const menu = useMenu(location);
  const stock = useMenuStock();
  const inCart = useCartStore((state) =>
    state.items.filter((line) => line.menuItemId === itemId).reduce((sum, line) => sum + line.quantity, 0),
  );
  const [quantity, setQuantity] = useState(1);
  /** Chosen option per pick-one group (the sauce), by group; none means its first one. */
  const [choices, setChoices] = useState<Record<string, string>>({});
  /** Options switched on (extra sauce). */
  const [extras, setExtras] = useState<string[]>([]);
  const item = menu.data?.find((row) => row.id === itemId);
  const groups = useMemo(() => optionGroupsFor(item, menu.data ?? []), [item, menu.data]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(orders)'));

  if (!item) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        {menu.isPending ? (
          <ActivityIndicator accessibilityLabel="Loading" color={theme.text} />
        ) : menu.isError ? (
          <ErrorState message="Couldn’t load the menu." onRetry={() => void menu.refetch()} style={styles.stateBox} />
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

  const note = stock.note(item.id);
  // At a pop-up, what's left is all there is; what's in your cart already counts.
  const atPopUp = location?.type === 'event';
  const room = atPopUp && stock.left[item.id] !== undefined ? stock.left[item.id] - inCart : MOST_AT_ONCE;
  const most = Math.max(1, Math.min(MOST_AT_ONCE, room));
  const count = Math.min(quantity, most);
  const canAdd = room > 0;

  const onAdd = () => {
    useCartStore
      .getState()
      .addItem({ menuItemId: item.id, name: item.name, priceCents: item.priceCents, options: chosen }, count);
    haptics.success();
    back();
  };

  const addBar = (
    <View style={styles.bar}>
      <View style={styles.quantity}>
        <Stepper value={count} onChange={setQuantity} min={1} max={most} label={item.name} />
      </View>
      <BlockButton
        label={canAdd ? 'Add to cart' : note?.soldOut ? 'Sold out' : 'All left are in your cart'}
        value={canAdd ? formatCents(unit * count) : undefined}
        onPress={onAdd}
        disabled={!canAdd}
        accessibilityHint={canAdd ? `Adds ${count} to your cart` : undefined}
        style={styles.add}
      />
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.flex} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}>
        <View style={[styles.photo, { height: 340 + insets.top, backgroundColor: theme.backgroundSelected }]}>
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
          {/* Under the photo: the section small, the item big with its price
              across from it, what's in it under that. */}
          <View style={styles.title}>
            {short !== item.name && item.category ? (
              <ThemedText type="label" style={{ color: theme.primaryText }}>
                {item.category}
              </ThemedText>
            ) : null}
            <View style={styles.titleRow}>
              <ThemedText
                type="title"
                accessibilityRole="header"
                headingLevel={1}
                accessibilityLabel={item.name}
                style={styles.name}
              >
                {short}
              </ThemedText>
              <ThemedText type="subtitle" style={styles.price}>
                {formatCents(item.priceCents)}
              </ThemedText>
            </View>
            {item.description ? (
              <ThemedText type="default" themeColor="textSecondary">
                {item.description}
              </ThemedText>
            ) : null}
            {note ? (
              <View style={styles.stock}>
                <Chip label={note.label} tone={note.soldOut ? 'dark' : 'warning'} />
                {note.soldOut && !atPopUp ? (
                  <ThemedText type="caption" themeColor="textSecondary">
                    You can still order it for another day: pick the day at checkout.
                  </ThemedText>
                ) : null}
              </View>
            ) : null}
          </View>
          <AllergenInfo item={item} options={groups.flatMap((group) => group.items)} />
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
                    label: shortItemName(option.name, group.name).replace(/ (sauce|dip)$/i, ''),
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
                      {option.priceCents > 0 ? (
                        <ThemedText type="caption" themeColor="textSecondary">
                          {formatCents(option.priceCents)} extra
                        </ThemedText>
                      ) : null}
                    </View>
                    <OptionPill
                      label={on ? 'Added' : 'Add'}
                      icon={on ? 'check' : 'add'}
                      checked={on}
                      toggle
                      accessibilityLabel={
                        option.priceCents > 0 ? `${option.name}, ${formatCents(option.priceCents)} extra` : option.name
                      }
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

          {/* How many and add, side by side right under the choices: where
              you finish, not down at the screen's edge. A guest can look
              through the choices; adding needs an account. */}
          {guest ? (
            <GuestLock inline {...JOIN.order}>
              {addBar}
            </GuestLock>
          ) : (
            addBar
          )}
        </View>
      </ScrollView>
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
    gap: 8,
  },
  stateBox: {
    alignSelf: 'stretch',
    marginHorizontal: 20,
  },
  scroll: {
    paddingBottom: 32,
  },
  bar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  quantity: {
    justifyContent: 'center',
    minHeight: 56,
  },
  // Fills the rest of the row; with very large text it drops under the stepper.
  add: {
    flexGrow: 1,
    flexBasis: 190,
    margin: 0,
    marginTop: 0,
    marginBottom: 0,
    marginHorizontal: 0,
  },
  center: {
    textAlign: 'center',
  },
  // The dish edge to edge, its bottom corners rounded like Home's photo.
  photo: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderBottomLeftRadius: Radius.tile + 8,
    borderBottomRightRadius: Radius.tile + 8,
  },
  plate: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  back: {
    position: 'absolute',
    left: PageInset,
  },
  page: {
    paddingHorizontal: PageInset,
    paddingTop: 24,
    gap: 12,
  },
  title: {
    gap: 8,
    paddingBottom: 8,
  },
  // The price sits beside the name, and drops under it when large text
  // leaves no room.
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    columnGap: 16,
    rowGap: 4,
  },
  name: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 180,
  },
  price: {
    flexShrink: 0,
  },
  stock: {
    alignItems: 'flex-start',
    gap: 8,
  },
  flex: {
    flex: 1,
  },
  group: {
    gap: 8,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 12,
    marginTop: 12,
  },
});
