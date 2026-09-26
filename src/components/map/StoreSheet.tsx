import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import StoreSheetContent from '@/components/map/StoreSheetContent';
import { useBusyStore } from '@/state/busyStore';
import { useTheme } from '@/hooks/useTheme';
import type { Store } from '@/types';

export type StoreSheetProps = {
  /** Whether the sheet should be presented (driven by the store pin tap). */
  visible: boolean;
  store: Store | null;
  onClose: () => void;
};

/**
 * Store details in a bottom sheet, anchored to the bottom with a slide-up
 * animation and a tap-to-dismiss backdrop. Built on RN's Modal (same pattern
 * as StoreSheet.web.tsx): @gorhom/bottom-sheet mounted but never animated on
 * this RN 0.86 / React 19 build, so the Modal keeps one implementation shape
 * across platforms. Fully controlled via `visible`.
 */
export default function StoreSheet({ visible, store, onClose }: StoreSheetProps) {
  const theme = useTheme();
  const busy = useBusyStore((state) => (store ? state.busy[store.id] : undefined));

  if (!store) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close store details"
      >
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.background }]}
          accessibilityViewIsModal
        >
          <View style={[styles.handle, { backgroundColor: theme.backgroundSelected }]} />
          <ScrollView contentContainerStyle={styles.content}>
            <StoreSheetContent
              store={store}
              busy={busy ?? store.busy}
              onClose={onClose}
            />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 999,
    marginBottom: 4,
  },
  content: {
    paddingBottom: 24,
  },
});
