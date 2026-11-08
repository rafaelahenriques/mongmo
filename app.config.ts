import type { ConfigContext, ExpoConfig } from 'expo/config';

import packageJson from './package.json';

/**
 * app.json, adjusted for the environment being built: development,
 * staging or production. EXPO_PUBLIC_APP_ENV picks it: eas.json sets it per
 * build profile, and it's unset (development) for `npx expo start`.
 *
 * Each environment is its own app on the phone (its own name and id), so
 * all three can be installed side by side, and each talks to its own
 * Supabase project. See docs/DEPLOYMENT.md.
 */
const VARIANTS = {
  development: { name: 'Mongmo (Dev)', idSuffix: '.dev' },
  staging: { name: 'Mongmo (Staging)', idSuffix: '.staging' },
  production: { name: 'Mongmo', idSuffix: '' },
} as const;

type AppEnv = keyof typeof VARIANTS;

function appEnv(): AppEnv {
  const value = process.env.EXPO_PUBLIC_APP_ENV || 'development';
  if (!(value in VARIANTS)) {
    throw new Error(`EXPO_PUBLIC_APP_ENV is "${value}". Use development, staging or production.`);
  }
  return value as AppEnv;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const env = appEnv();
  const { name, idSuffix } = VARIANTS[env];
  return {
    ...config,
    name,
    slug: config.slug ?? 'mongmo',
    // One version number: package.json's, which `npm version` bumps and
    // tags (docs/release-process.md). Build numbers are EAS's (remote).
    version: packageJson.version,
    ios: { ...config.ios, bundleIdentifier: `${config.ios?.bundleIdentifier}${idSuffix}` },
    android: { ...config.android, package: `${config.android?.package}${idSuffix}` },
    plugins: [
      ...(config.plugins ?? []),
      // Uploads source maps to Sentry, so crash reports show the real code.
      // Only when the build has a Sentry token (an EAS secret); without one
      // the build still works and crashes are still reported.
      ...(process.env.SENTRY_AUTH_TOKEN ? ['@sentry/react-native/expo'] : []),
    ],
    extra: { ...config.extra, appEnv: env },
  };
};
