import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

/**
 * Option chip. With `checked` it's a radio in a group (kind, duration,
 * challenge type); without, a one-tap preset button (start time).
 */
export function OptionPill({
  label,
  checked,
  icon,
  onPress,
}: {
  label: string;
  checked?: boolean;
  icon?: IconName;
  onPress: () => void;
}) {
  const theme = useTheme();
  const selected = checked === true;
  const color = selected ? theme.onPrimary : theme.text;
  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onPress();
      }}
      accessibilityRole={checked === undefined ? 'button' : 'radio'}
      accessibilityState={checked === undefined ? undefined : { checked }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: selected ? theme.primary : theme.backgroundSelected,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      {icon ? <Icon name={icon} size={14} color={color} /> : null}
      <ThemedText type="smallBold" style={{ color }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    minHeight: 38,
  },
});
