import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

/**
 * Native modules added to the app over time. An install built before one
 * was added (an older development build, a Simulator that wasn't rebuilt)
 * doesn't contain it, and importing its package there throws at load — which,
 * for a screen's imports, takes the whole app down at startup. So features
 * built on these check first, and load the package only when used.
 */
const NATIVE_MODULES = {
  imagePicker: 'ExponentImagePicker',
  motion: 'ExponentDeviceMotion',
  calendar: 'ExpoCalendar',
} as const;

export type NativeFeature = keyof typeof NATIVE_MODULES;

/** Whether this build includes the feature's native code (the web build has its own). */
export function hasNativeFeature(feature: NativeFeature): boolean {
  return Platform.OS === 'web' || requireOptionalNativeModule(NATIVE_MODULES[feature]) !== null;
}

/** Shown in place of a feature this install doesn't have yet. */
export const UPDATE_APP_MESSAGE = 'Update the app to use this (it needs a newer build).';
