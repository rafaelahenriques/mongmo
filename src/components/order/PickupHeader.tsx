import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapSketch } from '@/components/map/MapSketch';
import { TopBar } from '@/components/ui/TopBar';
import { CardShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/**
 * The cart and checkout header: a strip of street map with a white bar on
 * it, "PICK UP AT" and the place.
 */
export function PickupHeader({ place, onBack }: { place: string; onBack: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.strip, { paddingTop: insets.top + 28 }]}>
      <MapSketch variant={1} pin={false} style={StyleSheet.absoluteFill} />
      <View style={[styles.bar, { backgroundColor: theme.backgroundElement, boxShadow: CardShadow }]}>
        <TopBar title="Pick up at" value={place} onBack={onBack} topInset={false} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  bar: {
    paddingTop: 10,
  },
});
