import { ApiError, toApiError } from '@/api/errors';
import { placeOrder } from '@/api/orders';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({ supabase: { rpc: jest.fn() }, getCurrentUserId: jest.fn() }));
const rpc = jest.mocked(supabase.rpc) as unknown as jest.Mock;

const ORDER = { id: 'order-1', status: 'draft' };
const PAID = { id: 'order-1', status: 'paid' };

/** Answers each RPC by name, like the server would. */
function serverAnswers(answers: Record<string, { data?: unknown; error?: { message: string; code?: string } }>) {
  rpc.mockImplementation(async (name: string) => answers[name] ?? { data: null, error: null });
}

beforeEach(() => rpc.mockReset());

describe('placeOrder', () => {
  it('makes sure the profile exists, creates the order from item ids only, then pays', async () => {
    serverAnswers({ create_order: { data: ORDER }, confirm_mock_payment: { data: PAID } });
    const paid = await placeOrder(
      { type: 'store', storeId: 'cafe' },
      [
        { menuItemId: 'banh-mi', quantity: 2, options: ['extra-pork'] },
        { menuItemId: 'coffee', quantity: 1 },
      ],
      '2026-11-05T12:30:00.000Z',
      'reward-1',
    );
    expect(paid).toEqual(PAID);
    expect(rpc.mock.calls.map(([name]) => name)).toEqual(['ensure_profile', 'create_order', 'confirm_mock_payment']);
    expect(rpc).toHaveBeenCalledWith('create_order', {
      p_store_id: 'cafe',
      p_event_id: null,
      p_items: [
        { menu_item_id: 'banh-mi', quantity: 2, options: ['extra-pork'] },
        { menu_item_id: 'coffee', quantity: 1 },
      ],
      p_pickup_at: '2026-11-05T12:30:00.000Z',
      p_user_reward_id: 'reward-1',
    });
    expect(rpc).toHaveBeenCalledWith('confirm_mock_payment', { p_order_id: 'order-1' });
  });

  it('orders from a pop-up by its event id', async () => {
    serverAnswers({ create_order: { data: ORDER }, confirm_mock_payment: { data: PAID } });
    await placeOrder({ type: 'event', eventId: 'night-market', eventTitle: 'Night market' }, [], null);
    expect(rpc).toHaveBeenCalledWith(
      'create_order',
      expect.objectContaining({ p_store_id: null, p_event_id: 'night-market', p_user_reward_id: null }),
    );
  });

  it("never pays for an order the server didn't create", async () => {
    serverAnswers({ create_order: { error: { message: 'Item is not available' } } });
    await expect(placeOrder({ type: 'store', storeId: 'cafe' }, [], null)).rejects.toThrow('Item is not available');
    expect(rpc).not.toHaveBeenCalledWith('confirm_mock_payment', expect.anything());
  });

  it("stops when the profile can't be made", async () => {
    serverAnswers({ ensure_profile: { error: { message: 'Not signed in' } } });
    await expect(placeOrder({ type: 'store', storeId: 'cafe' }, [], null)).rejects.toBeInstanceOf(ApiError);
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});

describe('toApiError', () => {
  it("is a 404 when a single row wasn't found, else a 500, with the server's message", () => {
    expect(toApiError({ message: 'none', code: 'PGRST116' })).toMatchObject({ status: 404, message: 'none' });
    expect(toApiError({ message: 'boom' })).toMatchObject({ status: 500, name: 'ApiError' });
  });
});
