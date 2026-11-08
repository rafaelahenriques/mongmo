import type { ConfigContext, ExpoConfig } from 'expo/config';

import appConfig from '../../app.config';
import appJson from '../../app.json';
import { canShowLiveMap } from '@/lib/liveMap';

describe('canShowLiveMap', () => {
  it('always shows the map on iOS (Apple Maps needs no key)', () => {
    expect(canShowLiveMap('ios', undefined)).toBe(true);
  });

  it('shows it on Android only when the build has a Google Maps key', () => {
    expect(canShowLiveMap('android', { androidMaps: true })).toBe(true);
    expect(canShowLiveMap('android', { androidMaps: false })).toBe(false);
    expect(canShowLiveMap('android', undefined)).toBe(false);
  });

  it('never on the web', () => {
    expect(canShowLiveMap('web', { androidMaps: true })).toBe(false);
  });
});

describe('app.config: the Android Google Maps key', () => {
  const original = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  afterEach(() => {
    if (original === undefined) delete process.env.GOOGLE_MAPS_ANDROID_API_KEY;
    else process.env.GOOGLE_MAPS_ANDROID_API_KEY = original;
  });

  const build = (): ExpoConfig => appConfig({ config: appJson.expo } as unknown as ConfigContext);

  it('puts the key where Android reads it, and tells the app the map works', () => {
    process.env.GOOGLE_MAPS_ANDROID_API_KEY = ' test-key ';
    const config = build();
    expect(config.android?.config?.googleMaps?.apiKey).toBe('test-key');
    expect(config.extra?.androidMaps).toBe(true);
    // Only in android.config, which Expo leaves out of the embedded config.
    const { android, ...rest } = config;
    expect(JSON.stringify({ ...rest, android: { ...android, config: undefined } })).not.toContain('test-key');
  });

  it('without a key, builds anyway and the app shows the drawn map', () => {
    delete process.env.GOOGLE_MAPS_ANDROID_API_KEY;
    const config = build();
    expect(config.android?.config?.googleMaps).toBeUndefined();
    expect(config.extra?.androidMaps).toBe(false);
  });
});
