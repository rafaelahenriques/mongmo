import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { DishPlace } from '@/api/dishLimits';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/LoadState';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { useDishStock, useSetDishLimits } from '@/hooks/useDishStock';
import { useMenu } from '@/hooks/useMenu';
import { useTheme } from '@/hooks/useTheme';
import { showError } from '@/services/confirm';
import { haptics } from '@/services/haptics';
import type { CartLocation } from '@/state/cartStore';
import { HURRY_AT, LIMIT_MOST, parseLimit } from '@/utils/dishStock';

/**
 * Staff: how many of each dish a place can sell, as a list of the dishes
 * with a box each (empty is no limit). At a pop-up it's for the whole
 * pop-up; at the café it's for each day. Under each dish, how many are
 * ordered and left. Customers see "Hurry, only N left" from 10 left, and
 * "Sold out" at none; checkout stops at the limit.
 */
export default function OwnerDishLimits({
  place,
  menuLocation,
  perDay,
}: {
  place: DishPlace;
  /** Where the dishes come from: the same place, as the menu knows it. */
  menuLocation: CartLocation;
  /** At the café: the limit is for each day, and the counts are today's. */
  perDay: boolean;
}) {
  const theme = useTheme();
  const menu = useMenu(menuLocation);
  const stock = useDishStock(place);
  const save = useSetDishLimits(place);
  /** What's been typed and not saved yet, by dish. */
  const [typed, setTyped] = useState<Record<string, string>>({});

  const saved = useMemo(() => new Map((stock.data ?? []).map((row) => [row.menuItemId, row])), [stock.data]);
  const dishes = (menu.data ?? []).filter((item) => !item.addOnFor);
  const savedText = (id: string) => (saved.has(id) ? String(saved.get(id)?.max) : '');
  const changes = Object.entries(typed).filter(([id, text]) => text.trim() !== savedText(id));
  const invalid = changes.some(([, text]) => parseLimit(text) === 'invalid');

  const onSave = () =>
    save.mutate(
      changes.map(([menuItemId, text]) => ({ menuItemId, max: parseLimit(text) as number | null })),
      {
        onSuccess: () => {
          haptics.success();
          setTyped({});
        },
        onError: (error) => {
          haptics.error();
          showError('Couldn’t save the limits', error);
        },
      },
    );

  if (menu.isPending || stock.isPending) return <LoadingState />;
  if (menu.isError || stock.isError) {
    return (
      <ErrorState
        message="Couldn’t load the dishes."
        onRetry={() => {
          void menu.refetch();
          void stock.refetch();
        }}
      />
    );
  }
  if (dishes.length === 0) return <EmptyState icon="food" text="No dishes on this menu yet." />;

  return (
    <View style={styles.wrap}>
      <ThemedText type="small" themeColor="textSecondary">
        {perDay
          ? 'The most of each dish the café sells in a day. Leave it empty for no limit.'
          : 'The most of each dish this pop-up sells, pre-orders included. Leave it empty for no limit.'}{' '}
        {`From ${HURRY_AT} left, customers see “Hurry, only ${HURRY_AT} left”; at none, “Sold out”.`}
      </ThemedText>
      <Card style={styles.card}>
        {dishes.map((item, index) => {
          const row = saved.get(item.id);
          const counted = row ? `${row.sold ?? 0} ordered${perDay ? ' today' : ''} · ${row.left} left` : 'No limit';
          return (
            <View
              key={item.id}
              style={[
                styles.row,
                index < dishes.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
              ]}
            >
              <View style={styles.flex}>
                <ThemedText type="smallBold">{item.name}</ThemedText>
                <ThemedText type="caption" themeColor={row?.left === 0 ? 'danger' : 'textSecondary'}>
                  {counted}
                </ThemedText>
              </View>
              <View style={styles.box}>
                <TextField
                  label={`Most of ${item.name}${perDay ? ' a day' : ''}`}
                  hideLabel
                  placeholder="None"
                  value={typed[item.id] ?? savedText(item.id)}
                  onChangeText={(text) => setTyped((current) => ({ ...current, [item.id]: text }))}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={5}
                  returnKeyType="done"
                />
              </View>
            </View>
          );
        })}
      </Card>
      {invalid ? (
        <ThemedText type="caption" themeColor="danger" accessibilityRole="alert">
          A limit is a whole number from 0 to {LIMIT_MOST}, or empty for none.
        </ThemedText>
      ) : null}
      <Button
        label="Save limits"
        variant="brand"
        icon="check"
        onPress={onSave}
        loading={save.isPending}
        disabled={changes.length === 0 || invalid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.three,
  },
  card: {
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  flex: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 160,
    gap: 2,
  },
  box: {
    width: 104,
  },
});
