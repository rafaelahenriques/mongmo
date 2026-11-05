import { confirm } from '@/services/confirm';
import { switchPickup } from '@/services/switchPickup';
import { useCartStore } from '@/state/cartStore';

jest.mock('@/services/confirm', () => ({ confirm: jest.fn() }));
const confirmMock = jest.mocked(confirm);

const CAFE = { type: 'store' as const, storeId: 'cafe' };
const POP_UP = { type: 'event' as const, eventId: 'night-market', eventTitle: 'Night market' };

beforeEach(() => {
  confirmMock.mockReset();
  useCartStore.getState().clear();
  useCartStore.getState().setLocation(CAFE);
});

it('switches straight away when the cart is empty', async () => {
  await expect(switchPickup(POP_UP)).resolves.toBe(true);
  expect(confirmMock).not.toHaveBeenCalled();
  expect(useCartStore.getState().location).toEqual(POP_UP);
});

it("doesn't ask when it's the same place", async () => {
  useCartStore.getState().addItem({ menuItemId: 'banh-mi', name: 'Bánh mì', priceCents: 950 });
  await expect(switchPickup({ ...CAFE })).resolves.toBe(true);
  expect(confirmMock).not.toHaveBeenCalled();
  expect(useCartStore.getState().items).toHaveLength(1);
});

it('asks before emptying the cart, counting every item', async () => {
  useCartStore.getState().addItem({ menuItemId: 'banh-mi', name: 'Bánh mì', priceCents: 950 }, 3);
  confirmMock.mockResolvedValue(true);
  await expect(switchPickup(POP_UP)).resolves.toBe(true);
  expect(confirmMock).toHaveBeenCalledWith(
    'Start a new order here?',
    expect.stringContaining('the 3 items in your cart will be removed'),
    'Start new order',
  );
  expect(useCartStore.getState()).toMatchObject({ location: POP_UP, items: [] });
});

it('keeps the cart and the place when they say no', async () => {
  useCartStore.getState().addItem({ menuItemId: 'banh-mi', name: 'Bánh mì', priceCents: 950 });
  confirmMock.mockResolvedValue(false);
  await expect(switchPickup(POP_UP)).resolves.toBe(false);
  expect(useCartStore.getState().location).toEqual(CAFE);
  expect(useCartStore.getState().items).toHaveLength(1);
});
