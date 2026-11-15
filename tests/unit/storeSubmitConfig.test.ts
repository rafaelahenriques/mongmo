/**
 * Sending a build to the stores (`eas submit`). The app's id depends on
 * EXPO_PUBLIC_APP_ENV (app.config.ts). A build gets that from its profile,
 * but `eas submit` run by hand doesn't, so without the ids below it looks
 * up the store credentials of the development app (….dev) instead of
 * Mongmo's.
 */
const app = require('../../app.json').expo as {
  ios: { bundleIdentifier: string };
  android: { package: string };
};
const submit = require('../../eas.json').submit.production as {
  ios: { ascAppId?: string; bundleIdentifier?: string };
  android: { applicationId?: string };
};

it('names the production app for store credentials, whatever environment the command runs in', () => {
  expect(submit.ios.bundleIdentifier).toBe(app.ios.bundleIdentifier);
  expect(submit.android.applicationId).toBe(app.android.package);
});

it('knows which App Store Connect app the builds go to', () => {
  expect(submit.ios.ascAppId).toMatch(/^\d+$/);
});
