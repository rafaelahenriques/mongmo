import { Pressable, StyleSheet } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

/**
 * The small dark circle with a white icon from the design ("open order",
 * "my QR code"). A round control on the page, so it is a circle.
 */
export function RoundIconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 40,
}: {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.primary,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Icon name={icon} size={Math.round(size * 0.47)} color={theme.onPrimary} weight="semibold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
