import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useCartStore } from '@/state/cartStore';

type Option = { label: string; minutesFromNow: number | null };

const OPTIONS: Option[] = [
  { label: 'As soon as possible', minutesFromNow: null },
  { label: 'In 30 minutes', minutesFromNow: 30 },
  { label: 'In 1 hour', minutesFromNow: 60 },
];

/** Order flow, step 4: when to pick it up. */
export default function OrderPickupTimeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selected, setSelected] = useState<Option>(OPTIONS[0] as Option);

  const onContinue = () => {
    const iso =
      selected.minutesFromNow === null
        ? null
        : new Date(Date.now() + selected.minutesFromNow * 60_000).toISOString();
    useCartStore.getState().setPickupAt(iso);
    router.push('/(orders)/order/checkout');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
        Pickup at the truck — available until sold out.
      </ThemedText>

      {OPTIONS.map((option) => {
        const isSelected = option.label === selected.label;
        return (
          <Pressable
            key={option.label}
            onPress={() => setSelected(option)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={option.label}
            style={[
              styles.option,
              {
                borderColor: theme.border,
                backgroundColor: isSelected ? theme.highlight : theme.backgroundElement,
              },
            ]}
          >
            <ThemedText type="section" style={isSelected ? { color: theme.onHighlight } : undefined}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}

      <Button label="Continue to checkout" onPress={onContinue} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  hint: {
    marginBottom: Spacing.two,
  },
  option: {
    borderRadius: 12,
    borderWidth: 2,
    padding: Spacing.three,
  },
  button: {
    marginTop: Spacing.four,
  },
});
