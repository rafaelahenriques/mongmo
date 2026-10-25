import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: IconName;
  /** Shown large above the label, e.g. how many orders are in that column. */
  count?: number;
  /** Defaults to `label`. */
  accessibilityLabel?: string;
};

/**
 * Pill segmented control: the selected option is a solid Shadow Grey pill.
 * `fill` shares the full width equally between the options, so four of
 * them fit a small phone.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  surface = 'muted',
  fill = false,
  style,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  /** `floating` is a white track with a shadow, for controls over a map. */
  surface?: 'muted' | 'floating';
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.track,
        fill && styles.trackFill,
        surface === 'floating'
          ? { backgroundColor: theme.backgroundElement, boxShadow: `0px 6px 18px ${theme.shadow}` }
          : { backgroundColor: theme.backgroundSelected },
        style,
      ]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const color = selected ? theme.onPrimary : theme.text;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (selected) return;
              haptics.select();
              onChange(option.value);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            style={[
              styles.option,
              fill && styles.optionFill,
              option.count !== undefined && styles.optionStacked,
              selected && { backgroundColor: theme.primary },
            ]}
          >
            {option.icon ? <Icon name={option.icon} size={14} color={color} /> : null}
            {option.count !== undefined ? (
              <ThemedText type="section" style={{ color }}>
                {option.count}
              </ThemedText>
            ) : null}
            <ThemedText
              type={option.count !== undefined ? 'small' : 'smallBold'}
              numberOfLines={1}
              adjustsFontSizeToFit={fill}
              minimumFontScale={0.8}
              style={{ color }}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: Radius.pill,
    padding: 4,
    gap: 4,
    alignSelf: 'flex-start',
  },
  trackFill: {
    alignSelf: 'stretch',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    minHeight: 36,
  },
  optionFill: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
  },
  optionStacked: {
    flexDirection: 'column',
    gap: 0,
    paddingVertical: Spacing.one + 2,
  },
});
