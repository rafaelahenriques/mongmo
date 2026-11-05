import { getMenuItems, getOrderItems, type OrderRow } from '@/api/orders';
import { useCartStore, type CartLocation } from '@/state/cartStore';

/**
 * Puts a past order back in the cart: the same place, today's menu and
 * prices, the same options picked again by name. Anything no longer on the
 * menu is left out. Resolves to how many lines went in.
 */
export async function orderAgain(order: OrderRow, placeName = ''): Promise<number> {
  if (!order.event_id && !order.store_id) return 0;
  const location: CartLocation = order.event_id
    ? { type: 'event', eventId: order.event_id, eventTitle: placeName }
    : { type: 'store', storeId: order.store_id as string };
  const [menu, lines] = await Promise.all([getMenuItems(location), getOrderItems(order.id)]);

  const cart = useCartStore.getState();
  cart.setLocation(location);
  let added = 0;
  for (const line of lines) {
    const item = menu.find((candidate) => candidate.id === line.menu_item_id);
    if (!item) continue;
    const names = line.options_snapshot ? line.options_snapshot.split(', ') : [];
    const options = names.flatMap((name) => {
      const option = menu.find(
        (candidate) => candidate.name === name && candidate.addOnFor?.includes(item.category ?? ''),
      );
      return option ? [{ id: option.id, name: option.name, priceCents: option.priceCents }] : [];
    });
    cart.addItem({ menuItemId: item.id, name: item.name, priceCents: item.priceCents, options }, line.quantity);
    added += 1;
  }
  return added;
}
