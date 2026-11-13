import { orderRefetchInterval } from '@/hooks/useOrder';

describe('orderRefetchInterval', () => {
  it('checks every 2 seconds while an online payment is confirming', () => {
    expect(orderRefetchInterval({ status: 'draft', refund_status: null })).toBe(2_000);
  });

  it('checks every 15 seconds while the kitchen has it', () => {
    for (const status of ['placed', 'preparing', 'ready'] as const) {
      expect(orderRefetchInterval({ status, refund_status: null })).toBe(15_000);
    }
  });

  it('keeps checking a cancelled order until its refund is confirmed', () => {
    expect(orderRefetchInterval({ status: 'cancelled', refund_status: 'pending' })).toBe(15_000);
    expect(orderRefetchInterval({ status: 'cancelled', refund_status: 'refunded' })).toBe(false);
    expect(orderRefetchInterval({ status: 'cancelled', refund_status: null })).toBe(false);
  });

  it('stops once nothing more will change', () => {
    expect(orderRefetchInterval({ status: 'collected', refund_status: null })).toBe(false);
  });

  it('checks every 15 seconds before the first answer', () => {
    expect(orderRefetchInterval(undefined)).toBe(15_000);
  });
});
