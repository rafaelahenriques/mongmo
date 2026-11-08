import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Paper, paperAlpha, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

/**
 * Darkens a photo toward its bottom (and a little at the top, for buttons
 * there), so paper text over it reads. Decorative; fills its parent.
 */
export function PhotoShade({ from = 0.05, to = 0.78 }: { from?: number; to?: number }) {
  return (
    <Svg
      width="100%"
      height="100%"
      style={StyleSheet.absoluteFill}
      preserveAspectRatio="none"
      viewBox="0 0 1 1"
      aria-hidden
    >
      <Defs>
        <LinearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1C1D19" stopOpacity={from + 0.25} />
          <Stop offset="0.35" stopColor="#1C1D19" stopOpacity={from} />
          <Stop offset="1" stopColor="#1C1D19" stopOpacity={to} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="1" height="1" fill="url(#shade)" />
    </Svg>
  );
}

/** See-through glass for pills and round buttons over a photo. */
export const glass = {
  backgroundColor: paperAlpha(0.16),
  borderWidth: 1,
  borderColor: paperAlpha(0.42),
} as const;

/** Paper text over a photo, and its quieter second line. */
export const onPhoto = { color: Paper } as const;
export const onPhotoSoft = { color: paperAlpha(0.86) } as const;

/**
 * A pill button over a photo: sage for the main thing to do, glass for the
 * rest. The arrow goes on the sage one; an icon can lead the glass one.
 */
export function PhotoPill({
  label,
  onPress,
  tone = 'glass',
  icon,
  accessibilityLabel,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: 'brand' | 'glass';
  icon?: IconName;
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const brand = tone === 'brand';
  const color = brand ? theme.onBrand : Paper;
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.pill,
        brand ? { backgroundColor: theme.brandFill } : glass,
        { opacity: disabled ? 0.55 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={16} color={color} /> : null}
      <ThemedText type="button" style={{ color }}>
        {label}
      </ThemedText>
      {brand ? <Icon name="arrowRight" size={16} color={color} weight="bold" /> : null}
    </Pressable>
  );
}

/** A round glass button over a photo (back, share, the bell), with a sage dot for "something new". */
export function GlassButton({
  icon,
  label,
  dot = false,
  onPress,
}: {
  icon: IconName;
  label: string;
  dot?: boolean;
  onPress: () => void;
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
      hitSlop={4}
      style={({ pressed }) => [glass, styles.round, { opacity: pressed ? 0.75 : 1 }]}
    >
      <Icon name={icon} size={20} color={Paper} />
      {dot ? <View style={[styles.dot, { backgroundColor: theme.brandFill }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  round: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: Radius.pill,
  },
});
