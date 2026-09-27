import { memo } from 'react';

import { IconButton } from '@/components/ui/IconButton';

export type RecenterButtonProps = {
  /** Disabled (greyed) when location permission was denied or no fix yet. */
  enabled: boolean;
  onPress: () => void;
};

/** Floating map control that animates the camera back to the user. */
function RecenterButtonComponent({ enabled, onPress }: RecenterButtonProps) {
  return (
    <IconButton
      icon="recenter"
      tone="card"
      size={48}
      onPress={onPress}
      disabled={!enabled}
      accessibilityLabel={
        enabled ? 'Recenter the map on my location' : 'Recenter unavailable — location access is off'
      }
    />
  );
}

export default memo(RecenterButtonComponent);
