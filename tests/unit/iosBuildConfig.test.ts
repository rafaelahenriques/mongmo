/**
 * iOS builds: Stripe's package fetches its iOS SDK through Swift Package
 * Manager unless told otherwise, and that only works when the whole app
 * links as dynamic frameworks. This app links statically (Expo's default),
 * so without one of the two settings below `pod install` stops with
 * "requires dynamic frameworks" and no iOS build is made
 * (docs/release-process.md, Upgrading the Expo SDK).
 */
type Plugin = string | [string, Record<string, unknown>?];
const plugins = require('../../app.json').expo.plugins as Plugin[];

/** A plugin's options in app.json; undefined when the plugin isn't listed. */
function optionsOf(name: string): Record<string, unknown> | undefined {
  const plugin = plugins.find((entry) => (Array.isArray(entry) ? entry[0] : entry) === name);
  if (!plugin) return undefined;
  return Array.isArray(plugin) ? (plugin[1] ?? {}) : {};
}

it('lets Stripe’s iOS SDK install with the way the app is linked', () => {
  const stripe = optionsOf('@stripe/stripe-react-native');
  const ios = optionsOf('expo-build-properties')?.ios as { useFrameworks?: string } | undefined;

  expect(stripe).toBeDefined();
  expect(stripe?.disableSPM === true || ios?.useFrameworks === 'dynamic').toBe(true);
});
