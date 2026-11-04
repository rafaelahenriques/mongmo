import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { Paper } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

/**
 * An icon button. Over a photo (back, share) it's round and see-through
 * dark with a light icon, so it sits on any picture. `dark` is a solid
 * square for one on a colour block (the wallet's QR code).
 */
export function SquareIconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 40,
  tone = 'paper',
  style,
}: {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  tone?: 'paper' | 'dark';
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const dark = tone === 'dark';
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
          borderRadius: dark ? 0 : size / 2,
          backgroundColor: dark ? theme.surfaceDark : 'rgba(26, 26, 23, 0.5)',
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <Icon name={icon} size={Math.round(size * 0.5)} color={dark ? theme.onSurfaceDark : Paper} weight="semibold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
