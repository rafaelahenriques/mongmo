import { useEvent } from '@/hooks/useEvent';
import { useStore } from '@/hooks/useStore';
import { useCartStore, type CartLocation } from '@/state/cartStore';
import type { Coordinates } from '@/types';
import { getStoreStatus } from '@/utils/dateTime';
import type { PickupPlace } from '@/utils/pickupSlots';
import { popUpImage } from '@/constants/brandPhotos';

/** Where an order is picked up, resolved: its name, address, hours. */
export type ResolvedPlace = {
  kind: 'store' | 'event';
  name: string;
  address: string;
  coordinates: Coordinates;
  timeZone: string;
  /** "Open until 18:00", "Until 17:00". */
  openLabel: string;
  /** For pickup times. */
  pickup: PickupPlace;
  /** The pop-up's own photo, if it has one. */
  /** The pop-up's picture (URL or bundled); none for the café. */
  image: string | number | null;
};

/** The café or pop-up a cart (or an order) is for; null until it loads. */
export function usePlace(location: CartLocation | null): ResolvedPlace | null {
  const store = useStore();
  const event = useEvent(location?.type === 'event' ? location.eventId : '');

  if (location?.type === 'event') {
    const data = event.data;
    if (!data) return null;
    return {
      kind: 'event',
      name: data.title,
      address: data.venue,
      coordinates: data.coordinates,
      timeZone: data.timeZone,
      openLabel: `Until ${new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: data.timeZone }).format(new Date(data.endsAt))}`,
      pickup: { kind: 'event', startsAt: data.startsAt, endsAt: data.endsAt, timeZone: data.timeZone },
      image: popUpImage(data),
    };
  }
  if (location?.type === 'store' && store.data) {
    const data = store.data;
    return {
      kind: 'store',
      name: data.name,
      address: data.address,
      coordinates: data.coordinates,
      timeZone: data.timeZone,
      openLabel: getStoreStatus(data.hours, data.timeZone).label,
      pickup: { kind: 'store', hours: data.hours, timeZone: data.timeZone },
      image: null,
    };
  }
  return null;
}

/** The cart's pickup place. */
export function usePickupPlace(): ResolvedPlace | null {
  return usePlace(useCartStore((state) => state.location));
}
