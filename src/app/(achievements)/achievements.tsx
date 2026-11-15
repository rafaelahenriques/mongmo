import AchievementsScreen from '@/components/achievements/AchievementsScreen';
import { GuestGate } from '@/components/guest/GuestGate';
import { JOIN } from '@/components/guest/joinCopy';

export default function AchievementsRoute() {
  return (
    <GuestGate copy={JOIN.achievements}>
      <AchievementsScreen />
    </GuestGate>
  );
}
