import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { ThemedText } from '@/components/ThemedText';
import Chip from '@/components/ui/Chip';
import { PageInset } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useMotion } from '@/constants/motion';

/**
 * Photo first, name over it: Home's live pop-up and a pop-up's own page.
 * A shade darkens the top (status bar, controls) and the bottom (the name)
 * so paper text stays readable on any photo.
 */
export function PhotoHero({
  imageUrl,
  title,
  live = false,
  meta,
  top,
  height = 420,
  onPress,
  accessibilityLabel,
  headingLevel,
}: {
  imageUrl?: string;
  title: string;
  /** Shows the sage "Live now" chip above the name. */
  live?: boolean;
  /** Small text at the right of the name: the distance. */
  meta?: string;
  /** Controls along the top edge: the wordmark and greeting, or back and share. */
  top?: ReactNode;
  height?: number;
  /** Makes the photo a button (the controls on top stay separate buttons). */
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Makes the name a heading at this level (the pop-up page's h1). */
  headingLevel?: 1 | 2;
}) {
  const theme = useTheme();
  const motion = useMotion();
  return (
    <View style={[styles.hero, { minHeight: height, backgroundColor: theme.surfaceDark }]}>
      {imageUrl ? (
        <Image
          accessible={false}
          accessibilityLabel=""
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={motion.imageFadeMs}
        />
      ) : null}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1A1A17" stopOpacity={0.82} />
            <Stop offset="0.16" stopColor="#1A1A17" stopOpacity={0.66} />
            <Stop offset="0.34" stopColor="#1A1A17" stopOpacity={0} />
            <Stop offset="0.55" stopColor="#1A1A17" stopOpacity={0} />
            <Stop offset="1" stopColor="#1A1A17" stopOpacity={0.78} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#shade)" />
      </Svg>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? title}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {top}
      <View style={styles.bottom} pointerEvents="none">
        {live ? <Chip label="Live now" tone="live" /> : null}
        <View style={styles.nameRow}>
          {/* A long name gets a smaller size and a third line, and shrinks
              further (iOS, Android) rather than ending in "…". */}
          <ThemedText
            accessibilityRole={headingLevel ? 'header' : undefined}
            headingLevel={headingLevel}
            type="name"
            style={[styles.name, title.length > 18 && styles.nameLong, { color: theme.onSurfaceDark }]}
            numberOfLines={3}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {title}
          </ThemedText>
          {meta ? (
            <ThemedText type="captionBold" style={[styles.meta, { color: theme.onSurfaceDark }]}>
              {meta}
            </ThemedText>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // At least `height` tall, and taller when large text needs it: the name
  // sits at the bottom, below room for the controls along the top.
  hero: {
    overflow: 'hidden',
    justifyContent: 'flex-end',
    paddingTop: 120,
  },
  bottom: {
    paddingHorizontal: PageInset,
    paddingBottom: 18,
    gap: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    minWidth: 0,
  },
  nameLong: {
    fontSize: 34,
    lineHeight: 38,
  },
  meta: {
    marginTop: 3,
    flexShrink: 0,
  },
});
