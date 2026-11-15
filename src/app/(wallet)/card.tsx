import { GuestGate } from '@/components/guest/GuestGate';
import { JOIN } from '@/components/guest/joinCopy';
import MembershipCardScreen from '@/components/wallet/MembershipCardScreen';

export default function MembershipCardRoute() {
  return (
    <GuestGate copy={JOIN.wallet}>
      <MembershipCardScreen />
    </GuestGate>
  );
}
