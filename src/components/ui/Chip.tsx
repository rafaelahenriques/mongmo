import { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type ChipProps = {
  label: string;
  /**
   * neutral: light stone · dark: dark · live: sage ("Live now") ·
   * info: cream · success/danger/warning: light stone, semantic label (AA).
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
      ? theme.surfaceDark
      : tone === 'live'
        ? theme.brandFill
        : tone === 'info'
          ? theme.accent
          : theme.backgroundSelected;
  const color =
    tone === 'dark'
      ? theme.onSurfaceDark
      : tone === 'live'
        ? theme.onBrand
        : tone === 'info'
          ? theme.onAccent
          : tone === 'neutral'
            ? theme.text
            : theme[tone];

  return (
    <View style={[styles.chip, { backgroundColor: background }, style]}>
      {icon ? <Icon name={icon} size={12} color={color} /> : null}
      <ThemedText type="captionBold" numberOfLines={1} style={{ color }}>
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
    paddingHorizontal: 12,
    paddingVertical: Spacing.one,
    alignSelf: 'flex-start',
  },
});
