import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { placeOrder } from '@/api/orders';
import { usePlaceOrder } from '@/hooks/usePlaceOrder';
import { useCartStore } from '@/state/cartStore';

jest.mock('@/api/orders', () => ({ placeOrder: jest.fn() }));

const CAFE = { type: 'store' as const, storeId: 'cafe' };

async function setup() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = await renderHook(() => usePlaceOrder(), { wrapper });
  return { result, invalidate };
}

beforeEach(() => {
  useCartStore.getState().clear();
  useCartStore.getState().setLocation(CAFE);
  useCartStore.getState().addItem({ menuItemId: 'banh-mi', name: 'Bánh mì', priceCents: 950 });
});

it('empties the cart and refreshes orders, points and rewards once the order is placed', async () => {
  jest.mocked(placeOrder).mockResolvedValue({ id: 'order-1' } as never);
  const { result, invalidate } = await setup();

  await result.current.mutateAsync({ location: CAFE, items: [{ menuItemId: 'banh-mi', quantity: 1 }], pickupAt: null });

  expect(placeOrder).toHaveBeenCalledWith(CAFE, [{ menuItemId: 'banh-mi', quantity: 1 }], null, null);
  expect(useCartStore.getState().items).toEqual([]);
  const refreshed = invalidate.mock.calls.map(([filters]) => filters?.queryKey?.[0]);
  expect(refreshed).toEqual(expect.arrayContaining(['orders', 'active-order', 'points', 'rewards', 'user-rewards']));
});

it('keeps the cart when the order fails', async () => {
  jest.mocked(placeOrder).mockRejectedValue(new Error('Item is not available'));
  const { result } = await setup();

  await act(async () =>
    result.current.mutate({ location: CAFE, items: [{ menuItemId: 'banh-mi', quantity: 1 }], pickupAt: null }),
  );

  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(useCartStore.getState().items).toHaveLength(1);
});
