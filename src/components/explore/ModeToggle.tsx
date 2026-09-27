import { memo } from 'react';

import { Segmented } from '@/components/ui/Segmented';

export type ExploreMode = 'map' | 'list';

export type ModeToggleProps = {
  value: ExploreMode;
  onChange: (mode: ExploreMode) => void;
};

/** Map | List segmented toggle — both show the same upcoming pop-ups. */
function ModeToggleComponent({ value, onChange }: ModeToggleProps) {
  return (
    <Segmented
      options={[
        { value: 'map', label: 'Map', icon: 'map', accessibilityLabel: 'Map view' },
        { value: 'list', label: 'List', icon: 'list', accessibilityLabel: 'List view' },
      ]}
      value={value}
      onChange={onChange}
      accessibilityLabel="Explore view"
      surface="floating"
    />
  );
}

export default memo(ModeToggleComponent);
