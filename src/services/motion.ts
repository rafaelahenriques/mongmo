import { hasNativeFeature } from '@/services/nativeModules';

export type MotionAvailability = 'available' | 'needs-update' | 'no-sensor';
export type MotionSubscription = { remove: () => void };

/** Whether this device can measure movement. The iOS Simulator can't. */
export async function checkMotion(): Promise<MotionAvailability> {
  if (!hasNativeFeature('motion')) return 'needs-update';
  // Loaded on demand: see services/nativeModules.ts.
  const { DeviceMotion } = await import('expo-sensors');
  return (await DeviceMotion.isAvailableAsync().catch(() => false)) ? 'available' : 'no-sensor';
}

/**
 * Native motion readings need no permission. (On iOS, expo-sensors'
 * "motion permission" is the pedometer's Motion & Fitness access, which
 * these readings don't use.)
 */
export async function requestMotionAccess(): Promise<boolean> {
  return true;
}

/**
 * Calls `onForce` with each reading: how hard the phone is moving, as the
 * size of its acceleration with gravity removed, in m/s².
 */
export async function watchMotion(onForce: (force: number) => void, intervalMs: number): Promise<MotionSubscription> {
  const { DeviceMotion } = await import('expo-sensors');
  DeviceMotion.setUpdateInterval(intervalMs);
  return DeviceMotion.addListener(({ acceleration }) => {
    if (acceleration) onForce(Math.hypot(acceleration.x, acceleration.y, acceleration.z));
  });
}
