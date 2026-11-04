import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';

export type IconBadgeProps = {
  name: IconName;
  size?: number;
  /** muted: light stone · card: near-white · brand: sage · accent: cream · primary: dark · success. */
  tone?: 'muted' | 'card' | 'brand' | 'accent' | 'primary' | 'success';
  style?: StyleProp<ViewStyle>;
};

/** A symbol in a square block — list rows, badges, challenge types. Decorative. */
export function IconBadge({ name, size = 40, tone = 'muted', style }: IconBadgeProps) {
  const theme = useTheme();
  const { background, foreground } = {
    muted: { background: theme.backgroundSelected, foreground: theme.text },
    card: { background: theme.backgroundElement, foreground: theme.text },
    brand: { background: theme.brandFill, foreground: theme.onBrand },
    accent: { background: theme.accent, foreground: theme.onAccent },
    primary: { background: theme.surfaceDark, foreground: theme.onSurfaceDark },
    success: { background: theme.backgroundSelected, foreground: theme.success },
  }[tone];

  return (
    <View
      style={[styles.badge, { width: size, height: size, backgroundColor: background }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Icon name={name} size={Math.round(size * 0.45)} color={foreground} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
