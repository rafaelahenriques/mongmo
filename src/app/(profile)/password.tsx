import { GuestGate } from '@/components/guest/GuestGate';
import { JOIN } from '@/components/guest/joinCopy';
import ChangePasswordScreen from '@/components/profile/ChangePasswordScreen';

export default function ChangePasswordRoute() {
  return (
    <GuestGate copy={JOIN.password} preview={false}>
      <ChangePasswordScreen />
    </GuestGate>
  );
}
