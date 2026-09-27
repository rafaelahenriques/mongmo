import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import Chip from '@/components/ui/Chip';
import { Segmented } from '@/components/ui/Segmented';
import { Spacing } from '@/constants/theme';
import type { EventFilter } from '@/types';

const OPTIONS: { value: EventFilter; label: string }[] = [
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
  return (
    <View style={styles.row}>
      <Segmented
        options={OPTIONS.map((option) => ({ ...option, accessibilityLabel: `Show events: ${option.label}` }))}
        value={value}
        onChange={onChange}
        accessibilityLabel="Filter pop-up events by date"
        surface="floating"
        style={styles.segment}
      />
      {live ? <Chip label="Live" tone="success" /> : null}
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
    flexShrink: 1,
  },
});
