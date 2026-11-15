import { GuestGate } from '@/components/guest/GuestGate';
import { JOIN } from '@/components/guest/joinCopy';
import LevelsScreen from '@/components/wallet/LevelsScreen';

export default function LevelsRoute() {
  return (
    <GuestGate copy={JOIN.wallet}>
      <LevelsScreen />
    </GuestGate>
  );
}
