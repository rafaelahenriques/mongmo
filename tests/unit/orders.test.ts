import { ApiError, GENERIC_ERROR_MESSAGE, toApiError } from '@/api/errors';
import { placeOrder } from '@/api/orders';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({ supabase: { rpc: jest.fn() }, getCurrentUserId: jest.fn() }));
const rpc = jest.mocked(supabase.rpc) as unknown as jest.Mock;

const ORDER = { id: 'order-1', status: 'draft' };
const PLACED = { id: 'order-1', status: 'placed' };

/** Answers each RPC by name, like the server would. */
function serverAnswers(answers: Record<string, { data?: unknown; error?: { message: string; code?: string } }>) {
  rpc.mockImplementation(async (name: string) => answers[name] ?? { data: null, error: null });
}

beforeEach(() => rpc.mockReset());

describe('placeOrder', () => {
  it('makes sure the profile exists, creates the order from item ids only, then pays', async () => {
    serverAnswers({ create_order: { data: ORDER }, place_order: { data: PLACED } });
    const paid = await placeOrder(
      { type: 'store', storeId: 'cafe' },
      [
        { menuItemId: 'banh-mi', quantity: 2, options: ['extra-pork'] },
        { menuItemId: 'coffee', quantity: 1 },
      ],
      '2026-11-05T12:30:00.000Z',
      'reward-1',
    );
    expect(paid).toEqual(PLACED);
    expect(rpc.mock.calls.map(([name]) => name)).toEqual(['ensure_profile', 'create_order', 'place_order']);
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
    expect(rpc).toHaveBeenCalledWith('place_order', { p_order_id: 'order-1' });
  });

  it('orders from a pop-up by its event id', async () => {
    serverAnswers({ create_order: { data: ORDER }, place_order: { data: PLACED } });
    await placeOrder({ type: 'event', eventId: 'night-market', eventTitle: 'Night market' }, [], null);
    expect(rpc).toHaveBeenCalledWith(
      'create_order',
      expect.objectContaining({ p_store_id: null, p_event_id: 'night-market', p_user_reward_id: null }),
    );
  });

  it("never pays for an order the server didn't create", async () => {
    serverAnswers({ create_order: { error: { message: 'Item is not available', code: 'P0001' } } });
    await expect(placeOrder({ type: 'store', storeId: 'cafe' }, [], null)).rejects.toThrow('Item is not available');
    expect(rpc).not.toHaveBeenCalledWith('place_order', expect.anything());
  });

  it("stops when the profile can't be made", async () => {
    serverAnswers({ ensure_profile: { error: { message: 'Not signed in' } } });
    await expect(placeOrder({ type: 'store', storeId: 'cafe' }, [], null)).rejects.toBeInstanceOf(ApiError);
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});

describe('toApiError', () => {
  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('shows the messages our own database functions write for people', () => {
    expect(toApiError({ message: 'Not enough points for this reward', code: 'P0001' })).toMatchObject({
      status: 400,
      message: 'Not enough points for this reward',
    });
    expect(toApiError({ message: 'This account no longer exists. Sign in again.', code: 'P0002' }).message).toBe(
      'This account no longer exists. Sign in again.',
    );
  });

  it('never shows internal details: rules, grants, constraint names', () => {
    const leaky = [
      { message: 'new row violates row-level security policy for table "photos"', code: '42501' },
      { message: 'permission denied for function lifetime_points', code: '42501' },
      { message: 'duplicate key value violates unique constraint "user_rewards_pkey"', code: '23505' },
      { message: 'fetch failed' },
    ];
    for (const error of leaky) {
      expect(toApiError(error)).toMatchObject({ status: 500, message: GENERIC_ERROR_MESSAGE });
    }
    expect(toApiError({ message: 'violates check constraint "events_text_limits_check"', code: '23514' }).message).toBe(
      'Something there is too long or not allowed.',
    );
  });

  it('logs the detail, scrubbed, for whoever investigates', () => {
    toApiError({ message: 'permission denied for user 3f2a9c1e-1b2c-4d5e-8f90-123456789abc', code: '42501' });
    expect(console.warn).toHaveBeenCalledWith('[api] request failed (42501): permission denied for user [id]');
  });

  it('says "not found" when a single row is missing', () => {
    expect(
      toApiError({ message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' }),
    ).toMatchObject({
      status: 404,
      message: 'That couldn’t be found.',
    });
  });
});
