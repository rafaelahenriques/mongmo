import { memo } from 'react';

import { Segmented } from '@/components/ui/Segmented';
import type { EventFilter } from '@/types';

const OPTIONS: { value: EventFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'all', label: 'All' },
];

export type FilterBarProps = {
  value: EventFilter;
  onChange: (filter: EventFilter) => void;
};

/**
 * The date filter for pop-ups, as chips. Only pop-ups respond to
 * it; the permanent café is always there.
 */
function FilterBarComponent({ value, onChange }: FilterBarProps) {
  return (
    <Segmented
      options={OPTIONS.map((option) => ({ ...option, accessibilityLabel: `Show pop-ups: ${option.label}` }))}
      value={value}
      onChange={onChange}
      accessibilityLabel="Filter pop-ups by date"
      look="chips"
    />
  );
}

export default memo(FilterBarComponent);
