import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

/**
 * A paper square with an icon, for controls over a photo (back, share).
 * It attaches to the photo's edge, so it is square. `dark` for one on a
 * colour block (the wallet's QR code).
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
          backgroundColor: dark ? theme.surfaceDark : theme.background,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <Icon
        name={icon}
        size={Math.round(size * 0.5)}
        color={dark ? theme.onSurfaceDark : theme.text}
        weight="semibold"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
