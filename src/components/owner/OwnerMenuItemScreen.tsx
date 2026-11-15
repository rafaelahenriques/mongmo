import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import type { MenuItemInput, OwnerMenu, OwnerMenuItem } from '@/api/owner';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState, LoadingState } from '@/components/ui/LoadState';
import { OptionPill } from '@/components/ui/OptionPill';
import { TextField } from '@/components/ui/TextField';
import { Toggle } from '@/components/ui/Toggle';
import { ALLERGENS, type Allergen } from '@/constants/allergens';
import { Spacing } from '@/constants/theme';
import { useOwnerMenu } from '@/hooks/useOwnerMenu';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { confirm, showError } from '@/services/confirm';
import { haptics } from '@/services/haptics';
import {
  MENU_ITEM_LIMITS,
  menuItemProblem,
  menuSections,
  optionGroups,
  parsePrice,
  priceText,
} from '@/utils/menuItemForm';

/**
 * Owner: one item on the menu, to add (`itemId` null) or change. Its name,
 * what it is, its price; whether it's a dish or drink of its own or an
 * option for others (an extra, a sauce); which section it goes in; and
 * which of the 14 allergens it contains.
 */
export default function OwnerMenuItemScreen({ itemId }: { itemId: string | null }) {
  const theme = useTheme();
  const { query, menus } = useOwnerMenu();
  const existing = itemId ? menus.flatMap((menu) => menu.items).find((item) => item.id === itemId) : undefined;

  if (query.isPending) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <LoadingState />
      </View>
    );
  }
  if (query.isError || menus.length === 0 || (itemId !== null && !existing)) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ErrorState
          message={
            query.isError
              ? 'Couldn’t load the menu.'
              : menus.length === 0
                ? 'There’s no menu to add to yet.'
                : 'That item isn’t on the menu any more.'
          }
          onRetry={() => void query.refetch()}
        />
      </View>
    );
  }
  return <ItemForm menus={menus} existing={existing} />;
}

function ItemForm({ menus, existing }: { menus: OwnerMenu[]; existing?: OwnerMenuItem }) {
  const theme = useTheme();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const { create, update, remove } = useOwnerMenu();

  const [menuId, setMenuId] = useState(existing?.menuId ?? menus[0].id);
  const menu = menus.find((candidate) => candidate.id === menuId) ?? menus[0];
  const sections = menuSections(menu.items);
  const groups = optionGroups(menu.items);

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [price, setPrice] = useState(existing ? priceText(existing.priceCents) : '');
  const [available, setAvailable] = useState(existing?.available ?? true);
  const [isOption, setIsOption] = useState(Boolean(existing?.optionFor));
  // A dish's section and an option's group are both `category`: kept apart
  // here so switching between the two kinds doesn't carry one into the other.
  const [section, setSection] = useState(existing && !existing.optionFor ? existing.category : '');
  const [group, setGroup] = useState(existing?.optionFor ? existing.category : '');
  const [optionFor, setOptionFor] = useState<string[]>(existing?.optionFor ?? []);
  const [allergens, setAllergens] = useState<string[] | null>(existing?.allergens ?? null);
  const [problem, setProblem] = useState<string | null>(null);

  const saving = create.isPending || update.isPending;
  const serverError = (existing ? update.error : create.error)?.message ?? null;

  const onSave = () => {
    const draft = {
      name,
      description,
      priceCents: parsePrice(price),
      category: isOption ? group : section,
      available,
      optionFor: isOption ? optionFor : null,
      allergens,
    };
    const issue =
      menuItemProblem(draft) ??
      (isOption && optionFor.length === 0 ? 'Pick at least one section this option is offered with.' : null);
    setProblem(issue);
    if (issue || draft.priceCents === null) {
      haptics.error();
      return;
    }
    const input: MenuItemInput = { ...draft, priceCents: draft.priceCents };
    const done = {
      onSuccess: () => {
        haptics.success();
        router.back();
      },
      onError: () => haptics.error(),
    };
    if (existing) update.mutate({ itemId: existing.id, input }, done);
    else create.mutate({ menuId, input }, done);
  };

  const onDelete = async () => {
    if (!existing) return;
    haptics.warning();
    const yes = await confirm(
      `Delete ${existing.name}?`,
      'It goes from the menu for good. To take it off for a while, switch it off instead.',
      'Delete',
      { cancelLabel: 'Keep it', destructive: true },
    );
    if (!yes) return;
    remove.mutate(existing.id, {
      onSuccess: () => router.back(),
      onError: (error) => {
        haptics.error();
        showError('Couldn’t delete it', error);
      },
    });
  };

  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter((other) => other !== value) : [...list, value];

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + Spacing.five }]}
        keyboardShouldPersistTaps="handled"
      >
        {!existing && menus.length > 1 ? (
          <Card style={styles.group}>
            <ThemedText type="section">Menu</ThemedText>
            <View style={styles.pills} accessibilityRole="radiogroup" accessibilityLabel="Menu">
              {menus.map((candidate) => (
                <OptionPill
                  key={candidate.id}
                  label={candidate.name}
                  checked={candidate.id === menuId}
                  onPress={() => setMenuId(candidate.id)}
                />
              ))}
            </View>
          </Card>
        ) : null}

        <Card style={styles.group}>
          <ThemedText type="section">Details</ThemedText>
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Bánh mì, chicken"
            maxLength={MENU_ITEM_LIMITS.name}
          />
          <TextField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What’s in it? (optional)"
            multiline
            maxLength={MENU_ITEM_LIMITS.description}
          />
          <TextField
            label="Price in euros"
            value={price}
            onChangeText={setPrice}
            placeholder="4,50"
            keyboardType="decimal-pad"
            inputMode="decimal"
            maxLength={8}
            hint={isOption ? 'What it adds to the price. 0 for a free option.' : undefined}
          />
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <ThemedText type="smallBold">On the menu</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                Off: customers don’t see it.
              </ThemedText>
            </View>
            <Toggle value={available} onValueChange={setAvailable} accessibilityLabel="On the menu" />
          </View>
        </Card>

        <Card style={styles.group}>
          <ThemedText type="section">Where it goes</ThemedText>
          <View style={styles.pills} accessibilityRole="radiogroup" accessibilityLabel="Kind of item">
            <OptionPill label="A dish or drink" checked={!isOption} onPress={() => setIsOption(false)} />
            <OptionPill label="An option for other items" checked={isOption} onPress={() => setIsOption(true)} />
          </View>

          {isOption ? (
            <>
              <ThemedText type="smallBold">Offered with</ThemedText>
              {sections.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Add a dish or drink first: an option is offered with a section of the menu.
                </ThemedText>
              ) : (
                <View style={styles.pills}>
                  {sections.map((candidate) => (
                    <OptionPill
                      key={candidate}
                      label={candidate}
                      toggle
                      checked={optionFor.includes(candidate)}
                      onPress={() => setOptionFor((current) => toggleIn(current, candidate))}
                    />
                  ))}
                </View>
              )}
              <TextField
                label="Group"
                value={group}
                onChangeText={setGroup}
                placeholder="e.g. Extras"
                maxLength={MENU_ITEM_LIMITS.category}
                hint="Options are shown in groups. In a group whose name starts with “Choose” the customer picks exactly one; in any other, each option is switched on or off."
              />
              <Picks label="Use a group you have" values={groups} current={group} onPick={setGroup} />
            </>
          ) : (
            <>
              <TextField
                label="Section"
                value={section}
                onChangeText={setSection}
                placeholder="e.g. Bánh mì"
                maxLength={MENU_ITEM_LIMITS.category}
                hint="The heading it’s listed under. A new name makes a new section."
              />
              <Picks label="Use a section you have" values={sections} current={section} onPick={setSection} />
            </>
          )}
        </Card>

        <Card style={styles.group}>
          <ThemedText type="section">Allergens</ThemedText>
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <ThemedText type="smallBold">Checked with the kitchen</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {allergens === null
                  ? 'Off: customers see “Not listed yet”.'
                  : allergens.length === 0
                    ? 'Customers see “None of the 14 main allergens”.'
                    : 'Customers see the ones you pick.'}
              </ThemedText>
            </View>
            <Toggle
              value={allergens !== null}
              onValueChange={(checked) => setAllergens(checked ? [] : null)}
              accessibilityLabel="Allergens checked with the kitchen"
            />
          </View>
          {allergens !== null ? (
            <View style={styles.pills} accessibilityLabel="It contains">
              {(Object.keys(ALLERGENS) as Allergen[]).map((key) => (
                <OptionPill
                  key={key}
                  label={ALLERGENS[key]}
                  toggle
                  checked={allergens.includes(key)}
                  onPress={() => setAllergens((current) => toggleIn(current ?? [], key))}
                />
              ))}
            </View>
          ) : null}
        </Card>

        {(problem ?? serverError) ? (
          <ThemedText type="smallBold" themeColor="danger" accessibilityRole="alert">
            {problem ?? serverError}
          </ThemedText>
        ) : null}

        <Button
          label={existing ? 'Save item' : 'Add to the menu'}
          variant="brand"
          icon="check"
          haptic="press"
          loading={saving}
          onPress={onSave}
        />
        {existing ? (
          <Button label="Delete item" variant="danger" icon="trash" loading={remove.isPending} onPress={onDelete} />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** One-tap picks under a text field: the names already in use. */
function Picks({
  label,
  values,
  current,
  onPick,
}: {
  label: string;
  values: string[];
  current: string;
  onPick: (value: string) => void;
}) {
  if (values.length === 0) return null;
  return (
    <View style={styles.picks}>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={styles.pills} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {values.map((value) => (
          <OptionPill key={value} label={value} checked={value === current.trim()} onPress={() => onPick(value)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  state: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  content: {
    padding: Spacing.three + Spacing.one,
    gap: Spacing.three,
  },
  group: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  picks: {
    gap: Spacing.two,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
