import { cleanEnvValue, parseEnv, supabaseKeyRole } from '@/lib/env';

/** A JWT-shaped key with this payload; the signature doesn't matter here. */
const jwt = (payload: object) => `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify(payload)).replace(/=+$/, '')}.sig`;
const ANON = jwt({ role: 'anon', iss: 'supabase' });
const SERVICE = jwt({ role: 'service_role', iss: 'supabase' });

const valid = {
  appEnv: 'production',
  supabaseUrl: 'https://abcdefghij.supabase.co',
  supabaseAnonKey: ANON,
  sentryDsn: undefined,
  stripePublishableKey: undefined,
};

describe('parseEnv', () => {
  it('reads a valid production setup', () => {
    expect(parseEnv(valid)).toEqual({
      appEnv: 'production',
      supabaseUrl: 'https://abcdefghij.supabase.co',
      supabaseAnonKey: ANON,
      sentryDsn: null,
      stripePublishableKey: null,
    });
  });

  it('is development when nothing says otherwise', () => {
    expect(parseEnv({ ...valid, appEnv: undefined, supabaseUrl: 'http://127.0.0.1:54321' }).appEnv).toBe('development');
  });

  it('rejects an unknown environment', () => {
    expect(() => parseEnv({ ...valid, appEnv: 'prod' })).toThrow('Use development, staging or production');
  });

  it('says what is missing', () => {
    expect(() => parseEnv({ ...valid, supabaseAnonKey: '' })).toThrow('Missing EXPO_PUBLIC_SUPABASE_URL');
  });

  it('wants a full URL, not a project ref', () => {
    expect(() => parseEnv({ ...valid, supabaseUrl: 'abcdefghij' })).toThrow("isn't a full http(s) URL");
  });

  it('refuses plain http outside development', () => {
    expect(() => parseEnv({ ...valid, appEnv: 'staging', supabaseUrl: 'http://10.0.0.5:54321' })).toThrow(
      'must reach Supabase over https',
    );
  });

  it('refuses the service_role key, which would bypass every security rule', () => {
    expect(() => parseEnv({ ...valid, supabaseAnonKey: SERVICE })).toThrow('service_role (secret) key');
    expect(() => parseEnv({ ...valid, supabaseAnonKey: 'sb_secret_abc' })).toThrow('service_role (secret) key');
  });

  it('turns crash reporting on only with a DSN', () => {
    expect(parseEnv({ ...valid, sentryDsn: ' "https://key@o1.ingest.sentry.io/2" ' }).sentryDsn).toBe(
      'https://key@o1.ingest.sentry.io/2',
    );
  });
});

describe('the Stripe key', () => {
  it('takes a publishable key: test outside production, live in it', () => {
    expect(parseEnv({ ...valid, stripePublishableKey: 'pk_live_abc' }).stripePublishableKey).toBe('pk_live_abc');
    expect(
      parseEnv({ ...valid, appEnv: 'staging', stripePublishableKey: ' "pk_test_abc" ' }).stripePublishableKey,
    ).toBe('pk_test_abc');
  });

  it('refuses a secret or restricted key, which could move money', () => {
    expect(() => parseEnv({ ...valid, stripePublishableKey: 'sk_live_abc' })).toThrow('secret Stripe key');
    expect(() => parseEnv({ ...valid, stripePublishableKey: 'rk_live_abc' })).toThrow('secret Stripe key');
  });

  it('keeps test builds from charging real cards, and production from taking test payments', () => {
    expect(() => parseEnv({ ...valid, appEnv: 'staging', stripePublishableKey: 'pk_live_abc' })).toThrow(
      'must use a Stripe test key',
    );
    expect(() => parseEnv({ ...valid, stripePublishableKey: 'pk_test_abc' })).toThrow('needs the live Stripe key');
  });

  it('leaves online payment off without a key', () => {
    expect(parseEnv({ ...valid, stripePublishableKey: '' }).stripePublishableKey).toBeNull();
  });
});

describe('helpers', () => {
  it('strips whitespace and quotes pasted around a value', () => {
    expect(cleanEnvValue('  "https://x.supabase.co"\n')).toBe('https://x.supabase.co');
    expect(cleanEnvValue(undefined)).toBe('');
  });

  it("reads a key's role", () => {
    expect(supabaseKeyRole(ANON)).toBe('anon');
    expect(supabaseKeyRole(SERVICE)).toBe('service_role');
    expect(supabaseKeyRole('sb_publishable_abc')).toBe('anon');
    expect(supabaseKeyRole('not-a-key')).toBeNull();
  });
});
