import { GuestLock } from '@/components/guest/GuestLock';
import { JOIN } from '@/components/guest/joinCopy';
import OwnerMenuScreen from '@/components/owner/OwnerMenuScreen';
import { OwnerTab } from '@/components/owner/OwnerTab';
import WalletScreen from '@/components/wallet/WalletScreen';
import { useIsGuest } from '@/hooks/useIsGuest';
import { useOwnerView } from '@/hooks/useOwnerView';

/**
 * Wallet; in the owner's view this tab is Menu, where the menu is edited.
 * A guest sees the Wallet dimmed, under a card to make an account.
 */
export default function WalletRoute() {
  const ownerView = useOwnerView();
  const guest = useIsGuest();
  if (guest) {
    return (
      <GuestLock {...JOIN.wallet}>
        <WalletScreen />
      </GuestLock>
    );
  }
  if (!ownerView) return <WalletScreen />;
  return (
    <OwnerTab title="Menu">
      <OwnerMenuScreen />
    </OwnerTab>
  );
}
