import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';

/**
 * The editorial label column from the design's Home and Menu: a small
 * label with a footnote number on the left ("Right now¹"), the content in
 * the column to its right.
 */
export function ColumnRow({
  label,
  index,
  children,
  inverse = false,
  style,
}: PropsWithChildren<{
  label: string;
  /** The footnote number after the label. */
  index?: number;
  inverse?: boolean;
  style?: StyleProp<ViewStyle>;
}>) {
  const theme = useTheme();
  const color = inverse ? theme.onSurfaceDark : theme.text;
  return (
    <View style={[styles.row, style]}>
      <View style={styles.label} accessible accessibilityRole="header" accessibilityLabel={label}>
        <ThemedText type="captionBold" style={{ color }}>
          {label}
        </ThemedText>
        {index !== undefined ? (
          <ThemedText type="micro" style={{ color }}>
            {index}
          </ThemedText>
        ) : null}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 14,
    paddingBottom: 16,
  },
  label: {
    width: 100,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 1,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
});
