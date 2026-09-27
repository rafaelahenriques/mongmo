import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { EventFilter } from '@/types';

type FilterOption = {
  value: EventFilter;
  label: string;
};

const OPTIONS: FilterOption[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'all', label: 'All' },
];

export type FilterBarProps = {
  value: EventFilter;
  onChange: (filter: EventFilter) => void;
  /** Shows the "Live" indicator when the busy websocket is connected. */
  live?: boolean;
};

/**
 * Segmented date filter for the map. Only event pins respond to it — the
 * permanent store pin is always visible.
 */
function FilterBarComponent({ value, onChange, live = false }: FilterBarProps) {
  const theme = useTheme();

  return (
    <View
      style={styles.row}
      accessibilityRole="tablist"
      accessibilityLabel="Filter pop-up events by date"
    >
      <View style={[styles.segment, { backgroundColor: theme.backgroundElement }]}>
        {OPTIONS.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={`Show events: ${option.label}`}
              style={({ pressed }) => [
                styles.item,
                selected && { backgroundColor: theme.backgroundSelected },
                pressed && !selected && { opacity: 0.7 },
              ]}
            >
              <ThemedText type="smallBold" numberOfLines={1}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {live ? (
        <View
          style={[styles.live, { backgroundColor: theme.backgroundElement }]}
          accessibilityRole="text"
          accessibilityLabel="Busy counts update live"
        >
          <View style={[styles.liveDot, { backgroundColor: theme.success }]} />
          <ThemedText type="small" style={{ color: theme.success }}>
            Live
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

export default memo(FilterBarComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: Spacing.half,
    gap: Spacing.half,
    flexShrink: 1,
  },
  item: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: 12,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
