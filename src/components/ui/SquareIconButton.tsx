import { Pressable, StyleSheet } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

/**
 * A paper square with an icon, for controls over a photo (back, share).
 * It attaches to the photo's edge, so it is square.
 */
export function SquareIconButton({
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
        { width: size, height: size, backgroundColor: theme.background, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Icon name={icon} size={Math.round(size * 0.5)} color={theme.text} weight="semibold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
