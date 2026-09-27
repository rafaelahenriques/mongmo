export type MotionAvailability = 'available' | 'needs-update' | 'no-sensor';
export type MotionSubscription = { remove: () => void };

/** Safari's extra step before it shares motion (not in the DOM types yet). */
type MotionEventWithPermission = { requestPermission?: () => Promise<'granted' | 'denied'> };

/** Web: whether the browser has motion events at all. */
export async function checkMotion(): Promise<MotionAvailability> {
  return typeof DeviceMotionEvent === 'undefined' ? 'no-sensor' : 'available';
}

/**
 * Safari on iPhone shares motion only after asking, and only when asked
 * from a tap — so call this first thing in the tap handler.
 */
export async function requestMotionAccess(): Promise<boolean> {
  const motionEvent = DeviceMotionEvent as unknown as MotionEventWithPermission;
  if (!motionEvent.requestPermission) return true;
  return (await motionEvent.requestPermission().catch(() => 'denied')) === 'granted';
}

/**
 * Web: listens to the browser's devicemotion events directly (expo-sensors'
 * web DeviceMotion can't add listeners). The browser sets the pace, so
 * `intervalMs` is ignored.
 */
export async function watchMotion(onForce: (force: number) => void, _intervalMs: number): Promise<MotionSubscription> {
  const onMotion = ({ acceleration }: DeviceMotionEvent) => {
    if (acceleration?.x == null || acceleration.y == null || acceleration.z == null) return;
    onForce(Math.hypot(acceleration.x, acceleration.y, acceleration.z));
  };
  window.addEventListener('devicemotion', onMotion);
  return { remove: () => window.removeEventListener('devicemotion', onMotion) };
}
