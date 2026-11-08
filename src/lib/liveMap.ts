import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Whether this build can show the live map. iOS draws it with Apple Maps,
 * which needs nothing. Android draws it with Google Maps, which needs an
 * API key built into the app (GOOGLE_MAPS_ANDROID_API_KEY: app.config.ts);
 * without one, opening the map closes the app, so screens show a drawn
 * stand-in instead. The web has no live map.
 */
export function canShowLiveMap(os: string, extra: { androidMaps?: unknown } | null | undefined): boolean {
  if (os === 'ios') return true;
  if (os === 'android') return extra?.androidMaps === true;
  return false;
}

export const LIVE_MAP = canShowLiveMap(Platform.OS, Constants.expoConfig?.extra);
