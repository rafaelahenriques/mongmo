import { memo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type ChipProps = {
  label: string;
  /** Semantic tone; every option is WCAG AA against `backgroundSelected`. */
  tone?: 'neutral' | 'success' | 'danger' | 'warning';
  style?: ViewStyle;
};

/** Small status/metadata pill used on cards, chips rows and the detail screen. */
function ChipComponent({ label, tone = 'neutral', style }: ChipProps) {
  const theme = useTheme();
  const color = tone === 'neutral' ? theme.text : theme[tone];

  return (
    <View style={[styles.chip, { backgroundColor: theme.backgroundSelected }, style]}>
      <ThemedText type="small" numberOfLines={1} style={[styles.text, { color }]}>
        {label}
      </ThemedText>
    </View>
  );
}

export default memo(ChipComponent);

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 700,
  },
});
