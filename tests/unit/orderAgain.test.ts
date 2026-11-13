import { getMenuItems, getOrderItems, type OrderMenuItem, type OrderRow } from '@/api/orders';
import { orderAgain } from '@/services/orderAgain';
import { useCartStore } from '@/state/cartStore';

jest.mock('@/api/orders', () => ({ getMenuItems: jest.fn(), getOrderItems: jest.fn() }));

const item = (fields: Partial<OrderMenuItem> & Pick<OrderMenuItem, 'id' | 'name' | 'priceCents'>): OrderMenuItem => ({
  description: null,
  imageUrl: null,
  category: 'Bánh mì',
  addOnFor: null,
  allergens: null,
  ...fields,
});
const MENU = [
  item({ id: 'banh-mi', name: 'Bánh mì, crispy pork belly', priceCents: 1000 }),
  item({ id: 'extra-pork', name: 'Extra pork', priceCents: 250, category: null, addOnFor: ['Bánh mì'] }),
];

beforeEach(() => useCartStore.getState().clear());

it("puts the order back in the cart at today's prices, options found by name, gone items left out", async () => {
  jest.mocked(getMenuItems).mockResolvedValue(MENU);
  jest.mocked(getOrderItems).mockResolvedValue([
    { menu_item_id: 'banh-mi', quantity: 2, options_snapshot: 'Extra pork, Retired sauce' },
    { menu_item_id: 'no-longer-sold', quantity: 1, options_snapshot: null },
  ] as never);

  const added = await orderAgain({ id: 'order-1', store_id: 'cafe', event_id: null } as OrderRow);

  expect(added).toBe(1);
  expect(getMenuItems).toHaveBeenCalledWith({ type: 'store', storeId: 'cafe' });
  const { location, items } = useCartStore.getState();
  expect(location).toEqual({ type: 'store', storeId: 'cafe' });
  expect(items).toEqual([
    {
      key: 'banh-mi|extra-pork',
      menuItemId: 'banh-mi',
      name: 'Bánh mì, crispy pork belly',
      priceCents: 1000,
      options: [{ id: 'extra-pork', name: 'Extra pork', priceCents: 250 }],
      quantity: 2,
    },
  ]);
});

it('reorders from the same pop-up', async () => {
  jest.mocked(getMenuItems).mockResolvedValue(MENU);
  jest.mocked(getOrderItems).mockResolvedValue([]);
  await orderAgain({ id: 'order-2', store_id: null, event_id: 'night-market' } as OrderRow, 'Night market');
  expect(useCartStore.getState().location).toEqual({
    type: 'event',
    eventId: 'night-market',
    eventTitle: 'Night market',
  });
});

it('does nothing for an order with no place', async () => {
  await expect(orderAgain({ id: 'order-3', store_id: null, event_id: null } as OrderRow)).resolves.toBe(0);
});
