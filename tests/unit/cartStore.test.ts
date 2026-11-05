import {
  cartItemCount,
  cartLineKey,
  cartSubtotalCents,
  isSameLocation,
  useCartStore,
  type CartItem,
} from '@/state/cartStore';

const BANH_MI = { menuItemId: 'banh-mi', name: 'Bánh mì', priceCents: 950 };
const EXTRA_PORK = { id: 'extra-pork', name: 'Extra pork', priceCents: 200 };
const PATE = { id: 'pate', name: 'Pâté', priceCents: 100 };
const CAFE = { type: 'store' as const, storeId: 'cafe' };
const POP_UP = { type: 'event' as const, eventId: 'night-market', eventTitle: 'Night market' };

const cart = () => useCartStore.getState();

beforeEach(() => {
  cart().clear();
});

describe('cart lines', () => {
  it('adds the same item with the same options to one line', () => {
    cart().addItem({ ...BANH_MI, options: [EXTRA_PORK, PATE] });
    cart().addItem({ ...BANH_MI, options: [PATE, EXTRA_PORK] }, 2);
    expect(cart().items).toHaveLength(1);
    expect(cart().items[0]!.quantity).toBe(3);
  });

  it('keeps the same item with other options on its own line', () => {
    cart().addItem(BANH_MI);
    cart().addItem({ ...BANH_MI, options: [EXTRA_PORK] });
    expect(cart().items.map((line) => line.key)).toEqual(['banh-mi', 'banh-mi|extra-pork']);
  });

  it('keys a line by its item and its sorted options', () => {
    expect(cartLineKey('banh-mi')).toBe('banh-mi');
    expect(cartLineKey('banh-mi', [PATE, EXTRA_PORK])).toBe('banh-mi|extra-pork,pate');
  });

  it('removes a line when its quantity goes to zero', () => {
    cart().addItem(BANH_MI, 2);
    cart().setQuantity('banh-mi', 0);
    expect(cart().items).toEqual([]);
  });

  it('puts a removed line back where it was (undo), once', () => {
    cart().addItem(BANH_MI);
    cart().addItem({ menuItemId: 'coffee', name: 'Coffee', priceCents: 400 });
    cart().addItem({ menuItemId: 'rolls', name: 'Springrolls', priceCents: 700 });
    const removed = cart().items[1]!;
    cart().removeItem(removed.key);
    cart().restoreItem(removed, 1);
    cart().restoreItem(removed, 1);
    expect(cart().items.map((line) => line.menuItemId)).toEqual(['banh-mi', 'coffee', 'rolls']);
  });
});

describe('cart total', () => {
  it('adds options to each unit and multiplies by the quantity', () => {
    const lines: CartItem[] = [
      { ...BANH_MI, key: 'a', options: [EXTRA_PORK, PATE], quantity: 2 },
      { menuItemId: 'coffee', name: 'Coffee', priceCents: 400, key: 'b', options: [], quantity: 1 },
    ];
    expect(cartSubtotalCents(lines)).toBe((950 + 200 + 100) * 2 + 400);
    expect(cartItemCount(lines)).toBe(3);
  });
});

describe('pickup place', () => {
  it('keeps the cart at the same place and empties it at another', () => {
    cart().setLocation(CAFE);
    cart().addItem(BANH_MI);
    cart().setLocation({ ...CAFE });
    expect(cart().items).toHaveLength(1);
    cart().setLocation(POP_UP);
    expect(cart().items).toEqual([]);
    expect(cart().location).toEqual(POP_UP);
  });

  it('compares places by kind and id', () => {
    expect(isSameLocation(CAFE, { type: 'store', storeId: 'cafe' })).toBe(true);
    expect(isSameLocation(CAFE, POP_UP)).toBe(false);
    expect(isSameLocation(POP_UP, { ...POP_UP, eventTitle: 'Renamed' })).toBe(true);
    expect(isSameLocation(null, CAFE)).toBe(false);
  });

  it('clears everything, the reward included', () => {
    cart().setLocation(CAFE);
    cart().addItem(BANH_MI);
    cart().setUserRewardId('reward-1');
    cart().clear();
    expect(cart()).toMatchObject({ location: null, items: [], userRewardId: null });
  });
});

describe('saved carts from before options', () => {
  it('get a key and no options when loaded', async () => {
    const options = useCartStore.persist.getOptions();
    const migrated = (await options.migrate!(
      { location: null, items: [{ menuItemId: 'banh-mi', name: 'Bánh mì', priceCents: 950, quantity: 2 }] },
      0,
    )) as { items: CartItem[] };
    expect(migrated.items[0]).toEqual({ ...BANH_MI, quantity: 2, key: 'banh-mi', options: [] });
  });
});
