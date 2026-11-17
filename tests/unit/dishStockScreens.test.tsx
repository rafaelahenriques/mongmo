import { render, screen } from '@testing-library/react-native';

import type { OrderMenuItem } from '@/api/orders';
import ItemScreen from '@/components/order/ItemScreen';
import { ProductCard } from '@/components/order/ProductCard';
import { useCartStore } from '@/state/cartStore';
import { stockNote } from '@/utils/dishStock';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn() }),
  usePathname: () => '/order/item/banh-mi',
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const BANH_MI: OrderMenuItem = {
  id: 'banh-mi',
  name: 'Bánh mì pork',
  description: 'Pickled carrot, coriander',
  priceCents: 950,
  imageUrl: null,
  category: 'Bánh mì',
  addOnFor: null,
  allergens: [],
};
jest.mock('@/hooks/useMenu', () => ({
  useMenu: () => ({ data: [mockItem()], isPending: false, isError: false }),
}));
const mockItem = () => BANH_MI;

let mockLeft: Record<string, number> = {};
let mockDay: string | undefined;
jest.mock('@/hooks/useMenuStock', () => ({
  useMenuStock: () => ({
    left: mockLeft,
    day: mockDay,
    note: (id: string) => jest.requireActual('@/utils/dishStock').stockNote(mockLeft[id], mockDay),
  }),
}));

const POP_UP = { type: 'event' as const, eventId: 'night-market', eventTitle: 'Night market' };
const CAFE = { type: 'store' as const, storeId: 'cafe' };

beforeEach(() => {
  useCartStore.getState().clear();
  mockLeft = {};
  mockDay = undefined;
});

describe('the product card', () => {
  it('says hurry when few are left, in what a screen reader reads', async () => {
    await render(<ProductCard item={BANH_MI} stock={stockNote(4)} onPress={jest.fn()} />);
    expect(screen.getByText('Hurry, only 4 left')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /Bánh mì pork, 9[.,]50 euro\. Hurry, only 4 left/ })).toBeOnTheScreen();
  });

  it('says sold out', async () => {
    await render(<ProductCard item={BANH_MI} stock={stockNote(0)} onPress={jest.fn()} />);
    expect(screen.getByText('Sold out')).toBeOnTheScreen();
  });
});

describe('the item page', () => {
  it('at a sold-out pop-up dish, has nothing to add', async () => {
    useCartStore.getState().setLocation(POP_UP);
    mockLeft = { 'banh-mi': 0 };
    await render(<ItemScreen itemId="banh-mi" />);
    // The label under the name, and the button.
    expect(screen.getAllByText('Sold out')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Sold out/ })).toBeDisabled();
  });

  it('at a pop-up, counts what is already in the cart', async () => {
    useCartStore.getState().setLocation(POP_UP);
    useCartStore.getState().addItem({ menuItemId: 'banh-mi', name: 'Bánh mì pork', priceCents: 950 }, 2);
    mockLeft = { 'banh-mi': 2 };
    await render(<ItemScreen itemId="banh-mi" />);
    expect(screen.getByRole('button', { name: /All left are in your cart/ })).toBeDisabled();
  });

  it('at the café, sold out today can still be had another day', async () => {
    useCartStore.getState().setLocation(CAFE);
    mockLeft = { 'banh-mi': 0 };
    mockDay = 'today';
    await render(<ItemScreen itemId="banh-mi" />);
    expect(screen.getByText('Sold out today')).toBeOnTheScreen();
    expect(screen.getByText(/order it for another day/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /Add to cart/ })).toBeEnabled();
  });
});
