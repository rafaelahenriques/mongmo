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
  style,
}: {
  label: string;
  /** Shown before the label, in place of the arrow. */
  icon?: IconName;
  onPress: () => void;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
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
      {icon ? <Icon name={icon} size={18} color={theme.text} weight="semibold" /> : null}
      <ThemedText type="label">{label}</ThemedText>
      {icon ? null : <Icon name="arrowRight" size={16} color={theme.text} weight="bold" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // At least 44 tall to tap, whatever the text size.
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
  },
});
