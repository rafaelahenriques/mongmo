import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';

import type { EventFilter, PopUpEvent } from '@/types';

/**
 * Screenshot-tour switch. The verification simulator on this machine runs
 * headless (there is no Simulator.app, so no window exists to inject taps
 * into) — with EXPO_PUBLIC_UI_TOUR=1 this walks the same states a user would
 * reach on a timer, leaving capture windows for `simctl io screenshot`.
 * Without the env variable the hook is a no-op, so normal runs are untouched.
 */
const TOUR_ENABLED = process.env.EXPO_PUBLIC_UI_TOUR === '1';

interface UiTourControls {
  events: PopUpEvent[];
  openSheet: () => void;
  closeSheet: () => void;
  setFilter: (filter: EventFilter) => void;
}

/**
 * Drives MapScreen's own handlers (identical callbacks to pin presses and
 * filter chips), so the captured screens come from the real components.
 * Wide windows absorb the boot-marker jitter: store sheet @8–17s, week
 * @20–25s, all @25–29s, events list @34–42s, event detail @42s+.
 */
export function useUiTour(controls: UiTourControls): void {
  const router = useRouter();

  // Latest-commit mirror: timers fire later and must see current props.
  const controlsRef = useRef(controls);
  const routerRef = useRef(router);
  const startedRef = useRef(false);

  useEffect(() => {
    controlsRef.current = controls;
  });
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    if (!TOUR_ENABLED || startedRef.current) return undefined;
    startedRef.current = true;

    // Capture-debug aid: every step logs its fire time so screenshot timing
    // can be decoded against the Metro log instead of guessed.
    const step = (label: string, run: () => void): (() => void) => () => {
      console.log(`[ui-tour] ${label}`, Date.now());
      run();
    };

    console.log('[ui-tour] started', Date.now());
    const timers: ReturnType<typeof setTimeout>[] = [
      setTimeout(step('openSheet', () => controlsRef.current.openSheet()), 8_000),
      setTimeout(step('closeSheet', () => controlsRef.current.closeSheet()), 17_000),
      setTimeout(step('week', () => controlsRef.current.setFilter('week')), 20_000),
      setTimeout(step('all', () => controlsRef.current.setFilter('all')), 25_000),
      setTimeout(step('today', () => controlsRef.current.setFilter('today')), 29_000),
      setTimeout(step('list', () => routerRef.current.push('/(popups)')), 34_000),
      setTimeout(
        step('detail', () => {
          const first = controlsRef.current.events[0];
          if (first) {
            routerRef.current.push({
              pathname: '/(popups)/event/[id]',
              params: { id: first.id },
            });
          }
        }),
        42_000,
      ),
    ];

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);
}
