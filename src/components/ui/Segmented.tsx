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
  /** Defaults to `label`. */
  accessibilityLabel?: string;
};

/** Pill segmented control: the selected option is a solid Cool Brown pill. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  surface = 'muted',
  style,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  /** `floating` is a white track with a shadow, for controls over a map. */
  surface?: 'muted' | 'floating';
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.track,
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
            style={[styles.option, selected && { backgroundColor: theme.primary }]}
          >
            {option.icon ? <Icon name={option.icon} size={14} color={color} /> : null}
            <ThemedText type="smallBold" style={{ color }}>
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    minHeight: 36,
  },
});
