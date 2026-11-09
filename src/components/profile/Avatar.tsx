import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/ThemedText';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useMotion } from '@/constants/motion';

/**
 * Profile photo, or the name's initials on cream when there isn't one.
 * `cacheKey` (the photo's storage path) keeps a photo behind a short-lived
 * signed link from downloading again each time the link changes.
 */
export function Avatar({
  name,
  url,
  size = 84,
  cacheKey,
  decorative = false,
}: {
  name: string;
  url: string;
  size?: number;
  cacheKey?: string;
  /** When the name is said next to it anyway (a leaderboard row). */
  decorative?: boolean;
}) {
  const theme = useTheme();
  const motion = useMotion();
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  if (url) {
    return (
      <Image
        source={{ uri: url, cacheKey: cacheKey || undefined }}
        style={[styles.circle, { width: size, height: size, backgroundColor: theme.backgroundSelected }]}
        contentFit="cover"
        transition={motion.imageFadeMs}
        {...(decorative
          ? { accessible: false, accessibilityLabel: '' }
          : { accessibilityRole: 'image' as const, accessibilityLabel: `Profile photo of ${name}` })}
      />
    );
  }

  return (
    <View
      style={[styles.circle, styles.center, { width: size, height: size, backgroundColor: theme.accent }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <ThemedText type="subtitle" style={{ color: theme.onAccent, fontSize: size * 0.38, lineHeight: size * 0.44 }}>
        {initials || '?'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: Radius.pill,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
