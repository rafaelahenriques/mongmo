import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

/**
 * Outlined option chip, sage when picked. With `checked` it's a radio in a
 * group (kind, duration, challenge type), or a checkbox on its own
 * (`toggle`: extra protein); without, a one-tap preset button.
 */
export function OptionPill({
  label,
  checked,
  icon,
  toggle = false,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  checked?: boolean;
  icon?: IconName;
  /** On or off by itself, rather than one of a group. */
  toggle?: boolean;
  /** What a screen reader says, when the visible word isn't enough ("Add"). */
  accessibilityLabel?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const selected = checked === true;
  const color = selected ? theme.onBrand : theme.text;
  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onPress();
      }}
      accessibilityRole={checked === undefined ? 'button' : toggle ? 'checkbox' : 'radio'}
      accessibilityState={checked === undefined ? undefined : { checked }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: selected ? theme.brandFill : 'transparent',
          borderColor: selected ? theme.brandFill : theme.text,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      {icon ? <Icon name={icon} size={14} color={color} /> : null}
      <ThemedText type="captionBold" style={{ color }}>
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
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 28,
  },
});
