import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

/**
 * An uppercase label with an arrow ("SEE ALL 11 →"), or with an icon in
 * front instead when it does something specific (a calendar before "ADD TO CALENDAR").
 */
export function TextLink({
  label,
  icon,
  onPress,
  accessibilityHint,
  color,
  style,
}: {
  label: string;
  /** Shown before the label, in place of the arrow. */
  icon?: IconName;
  onPress: () => void;
  accessibilityHint?: string;
  /** On a coloured surface that stays the same in dark mode (cream): its ink. */
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const ink = color ?? theme.text;
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      hitSlop={10}
      style={({ pressed }) => [styles.link, { opacity: pressed ? 0.6 : 1 }, style]}
    >
      {icon ? <Icon name={icon} size={18} color={ink} weight="semibold" /> : null}
      <ThemedText type="label" style={{ color: ink }}>
        {label}
      </ThemedText>
      {icon ? null : <Icon name="arrowRight" size={16} color={ink} weight="bold" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // At least 44 tall to tap, whatever the text size.
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
});
