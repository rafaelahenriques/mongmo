import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

/**
 * A screen's title for screen readers only (its h1 on the web), for screens
 * whose visible title is a logo or a photo. Takes no space on screen.
 */
export function ScreenReaderTitle({ children }: { children: string }) {
  return (
    <ThemedText accessibilityRole="header" headingLevel={1} style={styles.hidden}>
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
  },
});
