import StoreSheetContent from '@/components/map/StoreSheetContent';
import { Sheet } from '@/components/ui/Sheet';
import type { Store } from '@/types';

export type StoreSheetProps = {
  /** Whether the sheet should be presented (driven by the store pin tap). */
  visible: boolean;
  store: Store | null;
  onClose: () => void;
};

/**
 * Store details in the shared bottom sheet (RN Modal, the same on native and
 * web: @gorhom/bottom-sheet mounted but never animated on this RN 0.86 /
 * React 19 build). Fully controlled via `visible`.
 */
export default function StoreSheet({ visible, store, onClose }: StoreSheetProps) {
  if (!store) return null;

  return (
    <Sheet visible={visible} title={store.name} subtitle={store.address} onClose={onClose}>
      <StoreSheetContent store={store} onClose={onClose} />
    </Sheet>
  );
}
