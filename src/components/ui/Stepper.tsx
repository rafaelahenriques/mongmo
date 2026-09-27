import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconButton } from '@/components/ui/IconButton';
import { Spacing } from '@/constants/theme';

/** − 2 + quantity control. Labels name the thing being counted. */
export function Stepper({
  value,
  onChange,
  min = 1,
  itemName,
  size = 'medium',
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  /** "Decrease quantity of {itemName}"; omit for a generic label. */
  itemName?: string;
  size?: 'medium' | 'large';
}) {
  const button = size === 'large' ? 48 : 34;
  const suffix = itemName ? ` of ${itemName}` : '';
  return (
    <View style={styles.row}>
      <IconButton
        icon="remove"
        tone="muted"
        size={button}
        haptic="select"
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
        accessibilityLabel={`Decrease quantity${suffix}`}
      />
      <ThemedText
        type={size === 'large' ? 'subtitle' : 'smallBold'}
        style={[styles.value, { minWidth: size === 'large' ? 40 : 22 }]}
        accessibilityLabel={`Quantity ${value}`}
      >
        {value}
      </ThemedText>
      <IconButton
        icon="add"
        tone="muted"
        size={button}
        haptic="select"
        onPress={() => onChange(value + 1)}
        accessibilityLabel={`Increase quantity${suffix}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  value: {
    textAlign: 'center',
  },
});
