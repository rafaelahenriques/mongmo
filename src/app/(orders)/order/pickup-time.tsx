import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconBadge } from '@/components/ui/IconBadge';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { useCartStore } from '@/state/cartStore';

type Option = { label: string; caption: string; icon: IconName; minutesFromNow: number | null };

const OPTIONS: Option[] = [
  { label: 'As soon as possible', caption: 'Usually 10–15 minutes', icon: 'flame', minutesFromNow: null },
  { label: 'In 30 minutes', caption: 'We’ll time it for you', icon: 'timer', minutesFromNow: 30 },
  { label: 'In 1 hour', caption: 'Plenty of time to get there', icon: 'clock', minutesFromNow: 60 },
];

/** Order flow, step 4: when to pick it up. */
export default function OrderPickupTimeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selected, setSelected] = useState<Option>(OPTIONS[0] as Option);

  const onContinue = () => {
    const iso =
      selected.minutesFromNow === null ? null : new Date(Date.now() + selected.minutesFromNow * 60_000).toISOString();
    useCartStore.getState().setPickupAt(iso);
    router.push('/(orders)/order/checkout');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">When will you pick up?</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Pickup only — available until sold out.
        </ThemedText>

        <View style={styles.options} accessibilityRole="radiogroup">
          {OPTIONS.map((option) => {
            const isSelected = option.label === selected.label;
            return (
              <Pressable
                key={option.label}
                onPress={() => {
                  if (isSelected) return;
                  haptics.select();
                  setSelected(option);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={option.label}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: isSelected ? theme.primary : 'transparent',
                    boxShadow: `0px 6px 18px ${theme.shadow}`,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <IconBadge name={option.icon} tone={isSelected ? 'primary' : 'muted'} size={44} />
                <View style={styles.optionTexts}>
                  <ThemedText type="smallBold">{option.label}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {option.caption}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.radio,
                    { borderColor: isSelected ? theme.primary : theme.border },
                    isSelected && { backgroundColor: theme.primary },
                  ]}
                >
                  {isSelected ? <Icon name="check" size={13} color={theme.onPrimary} weight="bold" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <ScreenFooter>
        <Button label="Continue to checkout" variant="brand" arrow onPress={onContinue} />
      </ScreenFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three + Spacing.one,
    gap: Spacing.two,
  },
  options: {
    gap: Spacing.two + Spacing.one,
    marginTop: Spacing.three,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 2,
    padding: Spacing.three,
  },
  optionTexts: {
    flex: 1,
    gap: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
