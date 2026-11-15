import { GuestGate } from '@/components/guest/GuestGate';
import { JOIN } from '@/components/guest/joinCopy';
import ProfileEditScreen from '@/components/profile/ProfileEditScreen';

export default function ProfileEditRoute() {
  return (
    <GuestGate copy={JOIN.profile}>
      <ProfileEditScreen />
    </GuestGate>
  );
}
