import { memo } from 'react';

import { Segmented } from '@/components/ui/Segmented';

export type ExploreMode = 'map' | 'list';

export type ModeToggleProps = {
  value: ExploreMode;
  onChange: (mode: ExploreMode) => void;
};

/** Map | List dark switch — both show the same upcoming pop-ups. */
function ModeToggleComponent({ value, onChange }: ModeToggleProps) {
  return (
    <Segmented
      options={[
        { value: 'map', label: 'Map', accessibilityLabel: 'Map view' },
        { value: 'list', label: 'List', accessibilityLabel: 'List view' },
      ]}
      value={value}
      onChange={onChange}
      accessibilityLabel="Explore view"
      look="switch"
    />
  );
}

export default memo(ModeToggleComponent);
