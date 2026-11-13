import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { createDraftOrder, placeAtPickup, waitForPayment } from '@/api/orders';
import { usePlaceOrder } from '@/hooks/usePlaceOrder';
import { payOrder } from '@/services/payments';
import { useCartStore } from '@/state/cartStore';

jest.mock('@/api/orders', () => ({
  createDraftOrder: jest.fn(),
  placeAtPickup: jest.fn(),
  waitForPayment: jest.fn(),
}));
jest.mock('@/services/payments', () => ({ payOrder: jest.fn() }));

const CAFE = { type: 'store' as const, storeId: 'cafe' };
const ITEMS = [{ menuItemId: 'banh-mi', quantity: 1 }];
const DRAFT = { id: 'order-1', total_cents: 950, status: 'draft' };

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
  jest.clearAllMocks();
  useCartStore.getState().clear();
  useCartStore.getState().setLocation(CAFE);
  useCartStore.getState().addItem({ menuItemId: 'banh-mi', name: 'Bánh mì', priceCents: 950 });
  jest.mocked(createDraftOrder).mockResolvedValue(DRAFT as never);
});

describe('paying at pickup', () => {
  it('makes the order, places it, empties the cart and refreshes orders, points and rewards', async () => {
    jest.mocked(placeAtPickup).mockResolvedValue({ ...DRAFT, status: 'placed' } as never);
    const { result, invalidate } = await setup();

    const placed = await result.current.mutateAsync({
      location: CAFE,
      items: ITEMS,
      pickupAt: null,
      payment: 'at_pickup',
    });

    expect(createDraftOrder).toHaveBeenCalledWith(CAFE, ITEMS, null, null);
    expect(placeAtPickup).toHaveBeenCalledWith('order-1');
    expect(payOrder).not.toHaveBeenCalled();
    expect(placed.outcome).toBe('placed');
    expect(useCartStore.getState().items).toEqual([]);
    const refreshed = invalidate.mock.calls.map(([filters]) => filters?.queryKey?.[0]);
    expect(refreshed).toEqual(expect.arrayContaining(['orders', 'active-order', 'points', 'rewards', 'user-rewards']));
  });

  it('keeps the cart when the order fails', async () => {
    jest.mocked(createDraftOrder).mockRejectedValue(new Error('Item is not available'));
    const { result } = await setup();

    await act(async () =>
      result.current.mutate({ location: CAFE, items: ITEMS, pickupAt: null, payment: 'at_pickup' }),
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useCartStore.getState().items).toHaveLength(1);
  });
});

describe('paying online', () => {
  it('pays the order the server made, then waits for Stripe to confirm it', async () => {
    jest.mocked(payOrder).mockResolvedValue('paid');
    jest.mocked(waitForPayment).mockResolvedValue({ ...DRAFT, status: 'placed', paid_at: 'now' } as never);
    const { result } = await setup();

    const paid = await result.current.mutateAsync({ location: CAFE, items: ITEMS, pickupAt: null, payment: 'online' });

    expect(payOrder).toHaveBeenCalledWith('order-1');
    expect(placeAtPickup).not.toHaveBeenCalled();
    expect(paid.outcome).toBe('paid');
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('keeps the cart and the order for another try when the payment sheet is closed', async () => {
    jest.mocked(payOrder).mockResolvedValue('cancelled');
    const { result } = await setup();

    const closed = await result.current.mutateAsync({
      location: CAFE,
      items: ITEMS,
      pickupAt: null,
      payment: 'online',
    });

    expect(closed).toEqual({ order: DRAFT, outcome: 'cancelled' });
    expect(waitForPayment).not.toHaveBeenCalled();
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it('uses the order made before, instead of making another', async () => {
    jest.mocked(payOrder).mockResolvedValue('paid');
    jest.mocked(waitForPayment).mockResolvedValue({ ...DRAFT, status: 'placed' } as never);
    const { result } = await setup();

    await result.current.mutateAsync({
      location: CAFE,
      items: ITEMS,
      pickupAt: null,
      payment: 'online',
      draft: { id: 'order-1', totalCents: 950 },
    });

    expect(createDraftOrder).not.toHaveBeenCalled();
    expect(payOrder).toHaveBeenCalledWith('order-1');
  });

  it('just places an order a reward pays for in full: nothing to charge', async () => {
    jest.mocked(createDraftOrder).mockResolvedValue({ ...DRAFT, total_cents: 0 } as never);
    jest.mocked(placeAtPickup).mockResolvedValue({ ...DRAFT, total_cents: 0, status: 'placed' } as never);
    const { result } = await setup();

    await result.current.mutateAsync({ location: CAFE, items: ITEMS, pickupAt: null, payment: 'online' });

    expect(payOrder).not.toHaveBeenCalled();
    expect(placeAtPickup).toHaveBeenCalledWith('order-1');
  });
});
