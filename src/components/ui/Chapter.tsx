import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';

/**
 * A section's heading, as in a magazine: a small deep-sage number ("01"),
 * the title, and maybe one link on the right ("MENU", "SEE ALL"). The
 * number is decoration; screen readers hear the title.
 */
export function Chapter({
  number,
  title,
  link,
  onPress,
  style,
}: {
  number?: string;
  title: string;
  link?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.chapter, style]}>
      {number ? (
        <ThemedText type="label" aria-hidden style={{ color: theme.primaryText }}>
          {number}
        </ThemedText>
      ) : null}
      <ThemedText type="subtitle" accessibilityRole="header" style={styles.title}>
        {title}
      </ThemedText>
      {link && onPress ? (
        <Pressable onPress={onPress} accessibilityRole="link" hitSlop={10} style={styles.link}>
          <ThemedText type="label" style={{ color: theme.primaryText }}>
            {link}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chapter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    flex: 1,
  },
  /** A text-only control, 44pt tall so it's easy to hit. */
  link: {
    minHeight: 44,
    justifyContent: 'center',
  },
});
