import OwnerMenuScreen from '@/components/owner/OwnerMenuScreen';
import { OwnerTab } from '@/components/owner/OwnerTab';
import WalletScreen from '@/components/wallet/WalletScreen';
import { useOwnerView } from '@/hooks/useOwnerView';

/** Wallet; in the owner's view this tab is Menu, where the menu is edited. */
export default function WalletRoute() {
  if (!useOwnerView()) return <WalletScreen />;
  return (
    <OwnerTab title="Menu">
      <OwnerMenuScreen />
    </OwnerTab>
  );
}
