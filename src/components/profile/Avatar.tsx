import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/ThemedText';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/** Profile photo, or the name's initials on Light Blue when there isn't one. */
export function Avatar({ name, url, size = 84 }: { name: string; url: string; size?: number }) {
  const theme = useTheme();
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[styles.circle, { width: size, height: size, backgroundColor: theme.backgroundSelected }]}
        contentFit="cover"
        transition={200}
        accessibilityRole="image"
        accessibilityLabel={`Profile photo of ${name}`}
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
