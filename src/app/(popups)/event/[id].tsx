import { useLocalSearchParams } from 'expo-router';

import EventDetail from '@/components/events/EventDetail';

/** Events-tab route for `/event/:id` — renders the shared event detail screen. */
export default function EventDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <EventDetail eventId={typeof id === 'string' ? id : ''} />;
}
