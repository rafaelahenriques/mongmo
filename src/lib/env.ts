/**
 * Which environment this build belongs to, and its settings. They come
 * from EXPO_PUBLIC_* variables, which are baked into the app when it's
 * built: from .env locally, from the EAS environment (development,
 * preview, production) for builds. See docs/DEPLOYMENT.md.
 */

export const APP_ENVS = ['development', 'staging', 'production'] as const;
export type AppEnv = (typeof APP_ENVS)[number];

export type EnvConfig = {
  appEnv: AppEnv;
  supabaseUrl: string;
  /** The public anon (publishable) key. Never the service_role key. */
  supabaseAnonKey: string;
  /** Crash reporting is off without one. */
  sentryDsn: string | null;
  /**
   * Stripe's publishable key (pk_…), for paying online. Online payment is
   * off without one. Test keys outside production, a live key in it.
   */
  stripePublishableKey: string | null;
};

type RawEnv = { [K in keyof EnvConfig]: string | undefined };

/**
 * A variable's value without stray whitespace or quotes, a common way to
 * end up with a non-empty but invalid value from a copy-paste into .env.
 */
export function cleanEnvValue(value: string | undefined): string {
  return (value ?? '').trim().replace(/^['"]|['"]$/g, '');
}

/** The role a Supabase key grants: from its prefix, or the JWT's payload. Null when it can't tell. */
export function supabaseKeyRole(key: string): string | null {
  if (key.startsWith('sb_secret_')) return 'service_role';
  if (key.startsWith('sb_publishable_')) return 'anon';
  const payload = key.split('.')[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const role = (JSON.parse(json) as { role?: unknown }).role;
    return typeof role === 'string' ? role : null;
  } catch {
    return null;
  }
}

/**
 * Checks the variables and says what to fix when they're wrong: missing,
 * not a URL, plain http outside development, or a secret key where only
 * the public one belongs (it would hand every user full database access).
 */
export function parseEnv(raw: RawEnv): EnvConfig {
  const appEnv = cleanEnvValue(raw.appEnv) || 'development';
  if (!(APP_ENVS as readonly string[]).includes(appEnv)) {
    throw new Error(`EXPO_PUBLIC_APP_ENV is "${appEnv}". Use development, staging or production.`);
  }

  const supabaseUrl = cleanEnvValue(raw.supabaseUrl);
  const supabaseAnonKey = cleanEnvValue(raw.supabaseAnonKey);
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to ' +
        '.env, point it at a project with the migrations in supabase/migrations applied, and ' +
        'restart the dev server (env changes need `npx expo start -c` to take effect).',
    );
  }
  if (!/^https?:\/\//i.test(supabaseUrl)) {
    throw new Error(
      `EXPO_PUBLIC_SUPABASE_URL is set to "${supabaseUrl}", which isn't a full http(s) URL. ` +
        'Use the Project URL from Supabase dashboard → Project Settings → API ' +
        '(e.g. https://abcdefghij.supabase.co), not just the project ref.',
    );
  }
  if (appEnv !== 'development' && !/^https:\/\//i.test(supabaseUrl)) {
    throw new Error(`A ${appEnv} build must reach Supabase over https, not "${supabaseUrl}".`);
  }
  if (supabaseKeyRole(supabaseAnonKey) === 'service_role') {
    throw new Error(
      'EXPO_PUBLIC_SUPABASE_ANON_KEY holds the service_role (secret) key, which bypasses every ' +
        'security rule. Use the anon / publishable key, and rotate the secret key if this build was shared.',
    );
  }

  const stripePublishableKey = cleanEnvValue(raw.stripePublishableKey) || null;
  if (stripePublishableKey) checkStripeKey(stripePublishableKey, appEnv as AppEnv);

  return {
    appEnv: appEnv as AppEnv,
    supabaseUrl,
    supabaseAnonKey,
    sentryDsn: cleanEnvValue(raw.sentryDsn) || null,
    stripePublishableKey,
  };
}

/**
 * Only a publishable key belongs in the app: a secret (sk_) or restricted
 * (rk_) key would let anyone with the app move money. Production takes
 * real payments (pk_live_), everything else test ones (pk_test_), so no
 * test build can charge a real card.
 */
function checkStripeKey(key: string, appEnv: AppEnv): void {
  if (/^(sk|rk)_/.test(key)) {
    throw new Error(
      'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY holds a secret Stripe key. Use the publishable key (pk_…); the ' +
        'secret one belongs in the Supabase function secrets only. Roll the secret key in Stripe if this build was shared.',
    );
  }
  const live = key.startsWith('pk_live_');
  if (!live && !key.startsWith('pk_test_')) {
    throw new Error('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY isn’t a Stripe publishable key (pk_test_… or pk_live_…).');
  }
  if (appEnv === 'production' && !live) {
    throw new Error('A production build needs the live Stripe key (pk_live_…), not a test key.');
  }
  if (appEnv !== 'production' && live) {
    throw new Error(`A ${appEnv} build must use a Stripe test key (pk_test_…), so it can't charge real cards.`);
  }
}

// Each variable must be read as a literal `process.env.EXPO_PUBLIC_*` member
// expression: that's the only form Expo inlines into the bundle. A dynamic
// `process.env[name]` works in dev but comes back undefined in release builds.
export const env = parseEnv({
  appEnv: process.env.EXPO_PUBLIC_APP_ENV,
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
});
