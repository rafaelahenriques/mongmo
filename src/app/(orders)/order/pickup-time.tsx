import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
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
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
            style={[
              styles.option,
              {
                borderColor: isSelected ? theme.text : theme.backgroundSelected,
                backgroundColor: isSelected ? theme.backgroundSelected : theme.backgroundElement,
              },
            ]}
          >
            <ThemedText type="smallBold">{option.label}</ThemedText>
          </Pressable>
        );
      })}

      <Pressable
        onPress={onContinue}
        accessibilityRole="button"
        accessibilityLabel="Continue to checkout"
        style={({ pressed }) => [styles.button, { backgroundColor: '#8B4513', opacity: pressed ? 0.9 : 1 }]}
      >
        <ThemedText type="smallBold" style={styles.buttonText}>
          Continue to checkout
        </ThemedText>
      </Pressable>
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
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
  button: {
    marginTop: Spacing.four,
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
  },
});
