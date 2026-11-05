import { confirm } from '@/services/confirm';
import { cartItemCount, isSameLocation, useCartStore, type CartLocation } from '@/state/cartStore';

/**
 * Sets where to pick up. Each place has its own menu, so moving to another
 * place empties the cart: when there's something in it, ask first.
 * Resolves whether the place was set (false when they keep their cart).
 */
export async function switchPickup(next: CartLocation): Promise<boolean> {
  const { location, items, setLocation } = useCartStore.getState();
  const count = cartItemCount(items);
  if (count > 0 && !isSameLocation(location, next)) {
    const yes = await confirm(
      'Start a new order here?',
      `Each place has its own menu, so the ${count} ${count === 1 ? 'item' : 'items'} in your cart will be removed.`,
      'Start new order',
    );
    if (!yes) return false;
  }
  setLocation(next);
  return true;
}
