import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { OwnerMenu, OwnerMenuItem } from '@/api/owner';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chapter } from '@/components/ui/Chapter';
import { Icon } from '@/components/ui/Icon';
import { EmptyState, ErrorState, LoadingState, useRefreshControl } from '@/components/ui/LoadState';
import { Toggle } from '@/components/ui/Toggle';
import { PageInset, Spacing } from '@/constants/theme';
import { useOwnerMenu } from '@/hooks/useOwnerMenu';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { showError } from '@/services/confirm';
import { haptics } from '@/services/haptics';
import { nameFromContent } from '@/utils/a11y';
import { menuSections, optionGroups } from '@/utils/menuItemForm';
import { formatCents } from '@/utils/orderFormat';

/**
 * The owner's Menu tab: everything customers can order, section by
 * section, then the options (extras, sauces). A switch takes an item off
 * the menu or puts it back; tapping one opens it to change its name,
 * price, section and allergens. New items are added from the top, and
 * "How many a day" sets the most of each dish the café sells in a day.
 */
export default function OwnerMenuScreen() {
  const theme = useTheme();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const refreshControl = useRefreshControl();
  const { query, menus, setAvailable } = useOwnerMenu();

  const toggle = (item: OwnerMenuItem, available: boolean) =>
    setAvailable.mutate(
      { itemId: item.id, available },
      {
        onError: (error) => {
          haptics.error();
          showError('That didn’t work', error);
        },
      },
    );
  // The switch shows the new position at once, while it saves.
  const pending = setAvailable.isPending ? setAvailable.variables : undefined;
  const isOn = (item: OwnerMenuItem) => (pending?.itemId === item.id ? pending.available : item.available);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 32 }]}
      refreshControl={refreshControl}
    >
      <Button label="Add an item" variant="brand" icon="add" onPress={() => router.push('/(wallet)/owner/menu/new')} />
      <Button
        label="How many a day"
        variant="ghost"
        icon="list"
        accessibilityHint="The most of each dish the café sells in a day"
        onPress={() => router.push('/(wallet)/owner/menu/limits')}
      />
      <ThemedText type="small" themeColor="textSecondary">
        What customers can order. Switch an item off to take it off the menu (sold out, not today). Tap one to change
        it.
      </ThemedText>

      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message="Couldn’t load the menu." onRetry={() => void query.refetch()} />
      ) : menus.every((menu) => menu.items.length === 0) ? (
        <EmptyState icon="food" text="Nothing on the menu yet. Add the first item above." />
      ) : (
        menus.map((menu) => (
          <MenuSections
            key={menu.id}
            menu={menu}
            // One menu is "the menu": its name only matters when there are more.
            showName={menus.length > 1}
            isOn={isOn}
            onToggle={toggle}
            onOpen={(item) => router.push({ pathname: '/(wallet)/owner/menu/[id]', params: { id: item.id } })}
          />
        ))
      )}
    </ScrollView>
  );
}

function MenuSections({
  menu,
  showName,
  isOn,
  onToggle,
  onOpen,
}: {
  menu: OwnerMenu;
  showName: boolean;
  isOn: (item: OwnerMenuItem) => boolean;
  onToggle: (item: OwnerMenuItem, available: boolean) => void;
  onOpen: (item: OwnerMenuItem) => void;
}) {
  const rows = (items: OwnerMenuItem[]) => (
    <Card style={styles.card}>
      {items.map((item, index) => (
        <ItemRow
          key={item.id}
          item={item}
          on={isOn(item)}
          last={index === items.length - 1}
          onToggle={(available) => onToggle(item, available)}
          onOpen={() => onOpen(item)}
        />
      ))}
    </Card>
  );
  const dishes = menu.items.filter((item) => !item.optionFor);
  const options = menu.items.filter((item) => item.optionFor);
  // Anything without a section still has to be reachable.
  const loose = dishes.filter((item) => !item.category);

  return (
    <>
      {showName ? (
        <ThemedText type="title" accessibilityRole="header" style={styles.menuName}>
          {menu.name}
        </ThemedText>
      ) : null}
      {menuSections(menu.items).map((section) => (
        <View key={section} style={styles.section}>
          <Chapter title={section} />
          {rows(dishes.filter((item) => item.category === section))}
        </View>
      ))}
      {loose.length > 0 ? (
        <View style={styles.section}>
          <Chapter title="No section yet" />
          {rows(loose)}
        </View>
      ) : null}
      {optionGroups(menu.items).map((group) => (
        <View key={group} style={styles.section}>
          <Chapter title={`Options: ${group}`} />
          {rows(options.filter((item) => item.category === group))}
        </View>
      ))}
    </>
  );
}

/** "€4,50", who it's an option for, and what still needs doing. */
function itemSummary(item: OwnerMenuItem, on: boolean): string {
  const price = item.optionFor && item.priceCents === 0 ? 'Free' : `€${formatCents(item.priceCents)}`;
  return [
    price,
    item.optionFor ? `with ${item.optionFor.join(', ')}` : null,
    item.allergens === null ? 'allergens not listed' : null,
    on ? null : 'off the menu',
  ]
    .filter(Boolean)
    .join(' · ');
}

function ItemRow({
  item,
  on,
  last,
  onToggle,
  onOpen,
}: {
  item: OwnerMenuItem;
  on: boolean;
  last: boolean;
  onToggle: (available: boolean) => void;
  onOpen: () => void;
}) {
  const theme = useTheme();
  const summary = itemSummary(item, on);
  return (
    <View style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
      <Pressable
        onPress={() => {
          haptics.tap();
          onOpen();
        }}
        accessibilityRole="button"
        accessibilityHint="Opens it to change"
        {...nameFromContent(`${item.name}, ${summary}`)}
        style={({ pressed }) => [styles.open, { opacity: pressed ? 0.6 : 1 }]}
      >
        <View style={styles.texts}>
          <ThemedText type="smallBold" themeColor={on ? undefined : 'textSecondary'}>
            {item.name}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {summary}
          </ThemedText>
        </View>
        <Icon name="chevronRight" size={16} color={theme.text} />
      </Pressable>
      <Toggle value={on} onValueChange={onToggle} accessibilityLabel={`${item.name} on the menu`} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PageInset,
    paddingTop: 4,
    gap: 16,
  },
  menuName: {
    marginTop: Spacing.three,
  },
  section: {
    gap: 12,
  },
  card: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // The whole left part opens the item; the switch on the right is its own control.
  open: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingVertical: 10,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
});
