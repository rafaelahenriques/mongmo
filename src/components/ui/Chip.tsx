import { memo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type ChipProps = {
  label: string;
  /**
   * neutral: paper · success/danger/warning: semantic text on paper (AA) ·
   * live: yellow sticker · info: Light Blue sticker.
   */
  tone?: 'neutral' | 'success' | 'danger' | 'warning' | 'live' | 'info';
  style?: ViewStyle;
};

/** Small outlined "sticker" for status and metadata on cards and detail screens. */
function ChipComponent({ label, tone = 'neutral', style }: ChipProps) {
  const theme = useTheme();
  const backgroundColor =
    tone === 'live' ? theme.highlight : tone === 'info' ? theme.accent : theme.backgroundElement;
  const color =
    tone === 'live'
      ? theme.onHighlight
      : tone === 'info'
        ? theme.onAccent
        : tone === 'neutral'
          ? theme.text
          : theme[tone];

  return (
    <View style={[styles.chip, { backgroundColor, borderColor: theme.border }, style]}>
      <ThemedText type="label" numberOfLines={1} style={[styles.text, { color }]}>
        {label}
      </ThemedText>
    </View>
  );
}

export default memo(ChipComponent);

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    lineHeight: 16,
  },
});
