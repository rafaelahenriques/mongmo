import { useMemo } from 'react';

import { placeOf } from '@/api/dishLimits';
import { leftById, useDishStock } from '@/hooks/useDishStock';
import { useNow } from '@/hooks/useNow';
import { usePickupPlace } from '@/hooks/usePickupPlace';
import { useCartStore } from '@/state/cartStore';
import { stockNote, type StockNote } from '@/utils/dishStock';
import { dayPhrase, pickupDays } from '@/utils/pickupSlots';

/**
 * How many are left of the dishes with a limit where you're ordering from,
 * for the menu: at a pop-up over all of it, at the café on the first day
 * you can pick up (the day the menu's header shows), which it says.
 */
export function useMenuStock(): {
  left: Record<string, number>;
  /** At the café, the day the limits are for ("today", "on Thu"); none at a pop-up. */
  day: string | undefined;
  note: (menuItemId: string) => StockNote | null;
} {
  const location = useCartStore((state) => state.location);
  const place = usePickupPlace();
  const now = useNow();
  const firstDay = useMemo(
    () =>
      place?.pickup.kind === 'store' ? pickupDays(place.pickup, now).find((entry) => entry.slots.length) : undefined,
    [place, now],
  );
  const stock = useDishStock(location ? placeOf(location) : null, firstDay?.ymd);
  const left = useMemo(() => leftById(stock.data), [stock.data]);
  // The first open day is always within the week, so its weekday is enough ("on Thu").
  const day = firstDay && place ? dayPhrase(firstDay.ymd, place.timeZone, now, true) : undefined;
  return { left, day, note: (menuItemId) => stockNote(left[menuItemId], day) };
}
