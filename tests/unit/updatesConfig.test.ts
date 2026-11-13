/**
 * Over-the-air updates (expo-updates): the settings that decide which
 * builds an update reaches. A slip here sends an update to the wrong app,
 * or to builds that can't run it.
 */
const app = require('../../app.json').expo as {
  runtimeVersion?: unknown;
  updates?: { url?: string };
  extra: { eas: { projectId: string } };
};
const eas = require('../../eas.json') as {
  build: Record<string, { channel?: string; extends?: string; env?: Record<string, string> }>;
};

it('asks this project’s update server', () => {
  expect(app.updates?.url).toBe(`https://u.expo.dev/${app.extra.eas.projectId}`);
});

it('ties an update to the app version, so it only reaches builds that can run it', () => {
  expect(app.runtimeVersion).toEqual({ policy: 'appVersion' });
});

it('gives each environment its own channel, named after it', () => {
  const channels = Object.entries(eas.build)
    .filter(([, profile]) => !profile.extends)
    .map(([name, profile]) => [name, profile.channel, profile.env?.EXPO_PUBLIC_APP_ENV]);
  expect(channels).toEqual([
    ['development', 'development', 'development'],
    ['staging', 'staging', 'staging'],
    ['production', 'production', 'production'],
  ]);
});
