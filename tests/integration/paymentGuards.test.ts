import { admin, deleteAccount, signUp, type Client, type Customer } from './helpers';

/**
 * The payment functions' guards (0038): Stripe events already handled and
 * the rate limit. Only the Edge Functions (the service role) may use them.
 */
let customer: Customer;

beforeAll(async () => {
  customer = await signUp();
});
afterAll(async () => {
  await deleteAccount(customer);
});

const rpc = (client: Client, fn: string, args: Record<string, unknown>) =>
  client.rpc(fn as never, args as never) as unknown as Promise<{ data: unknown; error: { message: string } | null }>;

const from = (client: Client, table: string) => client.from(table as never);

it('remembers a Stripe event once it was handled', async () => {
  const eventId = `evt_test_${Date.now()}`;
  expect(await rpc(admin, 'stripe_event_seen', { p_event_id: eventId })).toMatchObject({ data: false, error: null });

  const record = { p_event_id: eventId, p_type: 'payment_intent.succeeded', p_outcome: 'paid' };
  expect((await rpc(admin, 'record_stripe_event', record)).error).toBeNull();
  // Recording it twice is harmless.
  expect((await rpc(admin, 'record_stripe_event', record)).error).toBeNull();

  expect(await rpc(admin, 'stripe_event_seen', { p_event_id: eventId })).toMatchObject({ data: true, error: null });
  await from(admin, 'stripe_events')
    .delete()
    .eq('id' as never, eventId as never);
});

it('counts calls per person and action, and refuses past the limit', async () => {
  const take = (action: string) =>
    rpc(admin, 'take_rate_limit', {
      p_user_id: customer.userId,
      p_action: action,
      p_max: 3,
      // A window long enough not to roll over during the test.
      p_window_seconds: 3600,
    });
  const action = `test-${Date.now()}`;
  for (let call = 1; call <= 3; call++) expect(await take(action)).toMatchObject({ data: true, error: null });
  expect(await take(action)).toMatchObject({ data: false, error: null });
  // Another action has its own count.
  expect(await take(`${action}-other`)).toMatchObject({ data: true, error: null });
});

it('keeps both out of reach of the app', async () => {
  for (const [fn, args] of [
    ['stripe_event_seen', { p_event_id: 'evt_x' }],
    ['record_stripe_event', { p_event_id: 'evt_x', p_type: 'x', p_outcome: 'x' }],
    ['take_rate_limit', { p_user_id: customer.userId, p_action: 'x', p_max: 1, p_window_seconds: 60 }],
  ] as const) {
    expect((await rpc(customer.client, fn, args)).error).not.toBeNull();
  }
  for (const table of ['stripe_events', 'rate_limits']) {
    const read = await from(customer.client, table).select('*');
    // No grant, or no policy: either way nothing comes back.
    expect(read.data ?? []).toEqual([]);
  }
});

it('forgets a person’s counts when their account is deleted', async () => {
  const leaving = await signUp();
  await rpc(admin, 'take_rate_limit', { p_user_id: leaving.userId, p_action: 'x', p_max: 1, p_window_seconds: 60 });
  await deleteAccount(leaving);
  const left = await from(admin, 'rate_limits')
    .select('*')
    .eq('user_id' as never, leaving.userId as never);
  expect(left.data).toEqual([]);
});
