import { scrubText, scrubUrl, scrubValue } from '@/lib/privacy';

const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTYiLCJyb2xlIjoiYW5vbiJ9.c2lnbmF0dXJlLXZhbHVl';

describe('scrubText', () => {
  it.each([
    ['Signed in as rafaela.h+test@example.co.uk', 'Signed in as [email]'],
    ['order 3f2a9c1e-1b2c-4d5e-8f90-123456789abc failed', 'order [id] failed'],
    [`token ${JWT}`, 'token [jwt]'],
    ['Authorization: Bearer abc.def-123', 'Authorization: Bearer [token]'],
    ['key sb_secret_AbC123', 'key [key]'],
    ['call +32 56 94 43 81 or 0470 12 34 56', 'call [phone] or [phone]'],
    ['at 50.828912, 3.266431', 'at [coord], [coord]'],
  ])('removes personal data from %p', (input, expected) => {
    expect(scrubText(input)).toBe(expected);
  });

  it('leaves ordinary messages alone', () => {
    expect(scrubText('Query ["levels"] failed: permission denied for table levels')).toBe(
      'Query ["levels"] failed: permission denied for table levels',
    );
    expect(scrubText('watching 12 event region(s) at 10:30, €6.50')).toBe(
      'watching 12 event region(s) at 10:30, €6.50',
    );
  });

  it('cuts very long text', () => {
    expect(scrubText('x'.repeat(2000)).length).toBeLessThanOrEqual(501);
  });
});

describe('scrubUrl', () => {
  it('drops the query string and fragment, which carry filters and tokens', () => {
    expect(scrubUrl('https://x.supabase.co/rest/v1/orders?user_id=eq.abc#access_token=secret')).toBe(
      'https://x.supabase.co/rest/v1/orders',
    );
    expect(scrubUrl('/(profile)/order/3f2a9c1e-1b2c-4d5e-8f90-123456789abc')).toBe('/(profile)/order/[id]');
  });
});

describe('scrubValue', () => {
  it('redacts sensitive fields by name, however deep', () => {
    expect(
      scrubValue({
        status: 500,
        email: 'a@b.co',
        password: 'hunter2',
        profile: { displayName: 'Rafaela', points: 120, coords: { latitude: 50.8, longitude: 3.2 } },
        accessToken: 'abc',
      }),
    ).toEqual({
      status: 500,
      email: '[redacted]',
      password: '[redacted]',
      profile: { displayName: '[redacted]', points: 120, coords: '[redacted]' },
      accessToken: '[redacted]',
    });
  });

  it('reduces errors to their name and a scrubbed message', () => {
    expect(scrubValue(new TypeError('no user a@b.co'))).toBe('TypeError: no user [email]');
  });

  it('stops at a few levels deep and drops functions', () => {
    expect(scrubValue({ a: { b: { c: { d: { e: 1 } } } } })).toEqual({ a: { b: { c: { d: '[…]' } } } });
    expect(scrubValue(() => 1)).toBeUndefined();
  });
});
