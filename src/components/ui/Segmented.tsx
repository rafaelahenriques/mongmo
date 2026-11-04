import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { CardShadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: IconName;
  /** Shown after the label, e.g. how many orders are in that column: "New (2)". */
  count?: number;
  /** Defaults to `label`. */
  accessibilityLabel?: string;
};

/**
 * One of a few options, in the three looks the design gives different jobs:
 * - `words`: underlined words that filter a list (Today · This week · All).
 * - `switch`: a dark pill that changes the view (Map | List).
 * - `blocks`: square segments, sage when picked, that set a value
 *   (Bakery | Live pop-up, Mango | Peanut).
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  look = 'words',
  style,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  look?: 'words' | 'switch' | 'blocks';
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const select = (option: SegmentOption<T>) => {
    if (option.value === value) return;
    haptics.select();
    onChange(option.value);
  };

  return (
    <View
      style={[
        look === 'words' && styles.words,
        look === 'switch' && [styles.switch, { backgroundColor: theme.background, boxShadow: CardShadow }],
        look === 'blocks' && styles.blocks,
        style,
      ]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const label = option.count !== undefined ? `${option.label} (${option.count})` : option.label;
        const common = {
          onPress: () => select(option),
          accessibilityRole: 'tab' as const,
          accessibilityState: { selected },
          accessibilityLabel: option.accessibilityLabel ?? label,
        };

        if (look === 'switch') {
          const color = selected ? theme.onPrimary : theme.text;
          return (
            <Pressable key={option.value} {...common} style={[styles.switchOption, selected && { backgroundColor: theme.primary }]}>
              {option.icon ? <Icon name={option.icon} size={12} color={color} /> : null}
              <ThemedText type="captionBold" style={{ color }}>
                {label}
              </ThemedText>
            </Pressable>
          );
        }

        if (look === 'blocks') {
          return (
            <Pressable
              key={option.value}
              {...common}
              style={[styles.block, { backgroundColor: selected ? theme.brandFill : theme.backgroundSelected }]}
            >
              <ThemedText
                type="label"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={{ color: selected ? theme.onBrand : theme.textSecondary }}
              >
                {label}
              </ThemedText>
            </Pressable>
          );
        }

        return (
          <Pressable key={option.value} {...common} hitSlop={8}>
            <ThemedText
              type={selected ? 'captionBold' : 'caption'}
              style={[{ color: selected ? theme.text : theme.textSecondary }, selected && styles.underline]}
            >
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  words: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  underline: {
    textDecorationLine: 'underline',
  },
  switch: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderRadius: 18,
    padding: 3,
  },
  switchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: 15,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
  },
  blocks: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 2,
  },
  block: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 13,
  },
});
