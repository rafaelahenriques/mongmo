import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Crosshair } from 'lucide-react-native';

import { useTheme } from '@/hooks/useTheme';

export type RecenterButtonProps = {
  /** Disabled (greyed) when location permission was denied or no fix yet. */
  enabled: boolean;
  onPress: () => void;
};

/** Floating map control that animates the camera back to the user. */
function RecenterButtonComponent({ enabled, onPress }: RecenterButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={
        enabled
          ? 'Recenter the map on my location'
          : 'Recenter unavailable — location access is off'
      }
      accessibilityState={{ disabled: !enabled }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.backgroundSelected,
          opacity: !enabled ? 0.5 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Crosshair size={22} color={theme.text} />
    </Pressable>
  );
}

export default memo(RecenterButtonComponent);

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    // Elevation so it stays legible over map tiles.
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
