import { useEffect } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet } from 'react-native';

import StoreSheetContent from '@/components/map/StoreSheetContent';
import { useBusyStore } from '@/state/busyStore';
import { useTheme } from '@/hooks/useTheme';
import type { Store } from '@/types';

export type StoreSheetProps = {
  visible: boolean;
  store: Store | null;
  onClose: () => void;
};

/**
 * Web variant of the store sheet: the same bottom-anchored Modal panel as
 * StoreSheet.tsx, exposed through the identical controlled `visible` API.
 */
export default function StoreSheet({ visible, store, onClose }: StoreSheetProps) {
  const theme = useTheme();
  const busy = useBusyStore((state) => (store ? state.busy[store.id] : undefined));

  // Mirror the native sheet: only mounted while a store is set.
  useEffect(() => {
    if (!visible && store) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onClose is stable from MapScreen
  }, [visible]);

  if (!store) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close store details">
        <Pressable
          style={[styles.card, { backgroundColor: theme.background }]}
          accessibilityViewIsModal
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <StoreSheetContent store={store} busy={busy ?? store.busy} onClose={onClose} />
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
  card: {
    maxHeight: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
  },
  scrollContent: {
    paddingTop: 8,
  },
});
