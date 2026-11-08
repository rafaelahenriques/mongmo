import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
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
 * One of a few options. Each look has one job, so two rows of options on a
 * screen never look alike (the bigger the job, the bigger the look):
 * - `tabs`: the screen's views, as big words with an ink bar under the
 *   chosen one over a hairline (Badges | Leaderboard, Menu | Reorder).
 * - `chips`: a filter on a list, as small outlined pills, ink when chosen
 *   (Weekly · All-time, Today · This week · All).
 * - `switch`: a compact track for a setting or a floating view toggle
 *   (Map | List, System · Light · Dark).
 * - `blocks`: a full-width stone track of pills, the picked one sage and
 *   ringed, for a choice in a form (Bakery | Live pop-up, Mango | Peanut).
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  look,
  style,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  look: 'tabs' | 'chips' | 'switch' | 'blocks';
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
        look === 'tabs' && [styles.tabs, { borderBottomColor: theme.border }],
        look === 'chips' && styles.chips,
        look === 'switch' && [styles.switch, { backgroundColor: theme.background, boxShadow: CardShadow }],
        look === 'blocks' && [styles.blocks, { backgroundColor: theme.backgroundSelected }],
        style,
      ]}
      // Tabs and the view switch change what the screen shows; chips and
      // blocks pick one value, like radio buttons.
      accessibilityRole={look === 'tabs' || look === 'switch' ? 'tablist' : 'radiogroup'}
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const label = option.count !== undefined ? `${option.label} (${option.count})` : option.label;
        const asTab = look === 'tabs' || look === 'switch';
        const common = {
          onPress: () => select(option),
          accessibilityRole: asTab ? ('tab' as const) : ('radio' as const),
          'aria-selected': asTab ? selected : undefined,
          'aria-checked': asTab ? undefined : selected,
          accessibilityLabel: option.accessibilityLabel ?? label,
        };

        if (look === 'tabs') {
          return (
            <Pressable
              key={option.value}
              {...common}
              style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.6 : 1 }]}
            >
              <ThemedText type="section" style={{ color: selected ? theme.text : theme.textSecondary }}>
                {label}
              </ThemedText>
              {/* The chosen tab's bar sits on the hairline. */}
              <View style={[styles.tabBar, { backgroundColor: selected ? theme.text : 'transparent' }]} />
            </Pressable>
          );
        }

        if (look === 'chips') {
          return (
            <Pressable
              key={option.value}
              {...common}
              hitSlop={6}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: selected ? theme.primary : 'transparent',
                  borderColor: selected ? theme.primary : theme.outline,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <ThemedText type="captionBold" style={{ color: selected ? theme.onPrimary : theme.text }}>
                {label}
              </ThemedText>
            </Pressable>
          );
        }

        if (look === 'switch') {
          const color = selected ? theme.onPrimary : theme.text;
          return (
            <Pressable
              key={option.value}
              {...common}
              style={[styles.switchOption, selected && { backgroundColor: theme.primary }]}
            >
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
              style={[
                styles.block,
                {
                  backgroundColor: selected ? theme.brandFill : 'transparent',
                  // An ink ring, so the choice doesn't rest on sage vs stone alone.
                  borderColor: selected ? theme.text : 'transparent',
                },
              ]}
            >
              <ThemedText
                type="button"
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

        return null;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 24,
    borderBottomWidth: 1,
  },
  tab: {
    minHeight: 44,
    justifyContent: 'flex-end',
    gap: 8,
  },
  tabBar: {
    height: 3,
    marginBottom: -1,
  },
  chips: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    minHeight: 32,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switch: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: '100%',
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
    gap: 4,
    padding: 4,
    borderRadius: Radius.pill,
  },
  block: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 2,
    borderRadius: Radius.pill,
  },
});
