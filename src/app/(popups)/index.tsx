import ExploreScreen from '@/components/explore/ExploreScreen';
import OwnerEventsScreen from '@/components/owner/OwnerEventsScreen';
import { OwnerTab } from '@/components/owner/OwnerTab';
import { useOwnerView } from '@/hooks/useOwnerView';

/** Pop-ups (the map and list); in the owner's view, the pop-ups to manage. */
export default function PopupsRoute() {
  if (!useOwnerView()) return <ExploreScreen />;
  return (
    <OwnerTab title="Pop-ups">
      <OwnerEventsScreen />
    </OwnerTab>
  );
}
