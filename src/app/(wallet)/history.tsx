import { GuestGate } from '@/components/guest/GuestGate';
import { JOIN } from '@/components/guest/joinCopy';
import PointsHistoryScreen from '@/components/wallet/PointsHistoryScreen';

export default function PointsHistoryRoute() {
  return (
    <GuestGate copy={JOIN.wallet}>
      <PointsHistoryScreen />
    </GuestGate>
  );
}
