import { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type ChipProps = {
  label: string;
  /**
   * neutral: rose fill · dark: Shadow Grey · live: sage with a dot ·
   * info: cream · success/danger/warning: rose fill, semantic label (AA).
   */
  tone?: 'neutral' | 'dark' | 'live' | 'info' | 'success' | 'danger' | 'warning';
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
};

/** Small pill for status and metadata. */
function ChipComponent({ label, tone = 'neutral', icon, style }: ChipProps) {
  const theme = useTheme();
  const background =
    tone === 'dark'
      ? theme.primary
      : tone === 'live'
        ? theme.brandFill
        : tone === 'info'
          ? theme.accent
          : theme.backgroundSelected;
  const color =
    tone === 'dark'
      ? theme.onPrimary
      : tone === 'live'
        ? theme.onBrand
        : tone === 'info'
          ? theme.onAccent
          : tone === 'neutral'
            ? theme.text
            : theme[tone];

  return (
    <View style={[styles.chip, { backgroundColor: background }, style]}>
      {tone === 'live' ? <View style={[styles.dot, { backgroundColor: theme.onBrand }]} /> : null}
      {icon ? <Icon name={icon} size={12} color={color} /> : null}
      <ThemedText type="smallBold" numberOfLines={1} style={[styles.text, { color }]}>
        {label}
      </ThemedText>
    </View>
  );
}

export default memo(ChipComponent);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    lineHeight: 16,
  },
});
