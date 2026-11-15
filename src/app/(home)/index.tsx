import HomeScreen from '@/components/home/HomeScreen';
import OwnerHomeScreen from '@/components/owner/OwnerHomeScreen';
import { OwnerTab } from '@/components/owner/OwnerTab';
import { useOwnerView } from '@/hooks/useOwnerView';

/** Home; in the owner's view, Today. */
export default function HomeRoute() {
  if (!useOwnerView()) return <HomeScreen />;
  return (
    <OwnerTab title="Today">
      <OwnerHomeScreen />
    </OwnerTab>
  );
}
