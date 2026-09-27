import { useEffect, useRef } from 'react';
import { Appearance } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

import { useSettingsStore } from '@/state/settingsStore';
import type { EventFilter, PopUpEvent } from '@/types';

/**
 * Screenshot-tour switch. The verification simulator on this machine runs
 * headless (there is no Simulator.app, so no window exists to inject taps
 * into) — with EXPO_PUBLIC_UI_TOUR=1 this walks the same states a user would
 * reach on a timer, leaving capture windows for `simctl io screenshot`.
 * EXPO_PUBLIC_UI_TOUR=profile walks the profile/achievements screens
 * instead (deep links can't be used: iOS 26 shows an untappable
 * "Open in…?" dialog for simctl openurl). Without the env variable the hook
 * is a no-op, so normal runs are untouched.
 */
const TOUR_MODE = process.env.EXPO_PUBLIC_UI_TOUR;
const TOUR_ENABLED = TOUR_MODE === '1' || TOUR_MODE === 'profile';
const PROFILE_TOUR = TOUR_MODE === 'profile';

interface UiTourControls {
  events: PopUpEvent[];
  openSheet: () => void;
  closeSheet: () => void;
  setFilter: (filter: EventFilter) => void;
  setMode: (mode: 'map' | 'list') => void;
}

/**
 * Drives MapScreen's own handlers (identical callbacks to pin presses and
 * filter chips), so the captured screens come from the real components.
 * Wide windows absorb the boot-marker jitter: store sheet @8–17s, week
 * @20–25s, all @25–29s, events list @34–42s, event detail @42s+.
 */
export function useUiTour(controls: UiTourControls): void {
  const router = useRouter();
  const pathname = usePathname();

  // Latest-commit mirror: timers fire later and must see current props.
  const controlsRef = useRef(controls);
  const routerRef = useRef(router);
  const pathnameRef = useRef(pathname);
  const startedRef = useRef(false);

  useEffect(() => {
    controlsRef.current = controls;
  });
  useEffect(() => {
    routerRef.current = router;
  }, [router]);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!TOUR_ENABLED || startedRef.current) return undefined;
    startedRef.current = true;

    // Capture-debug aid: every step logs its fire time so screenshot timing
    // can be decoded against the Metro log instead of guessed.
    const step = (label: string, run: () => void): (() => void) => () => {
      console.log(`[ui-tour] ${label}`, Date.now(), 'at', pathnameRef.current);
      run();
      // Capture-debug: prove whether the router accepted the navigation
      // (JS state) even if the native paint that follows does not appear.
      setTimeout(() => {
        console.log(`[ui-tour] ${label}-after`, Date.now(), 'at', pathnameRef.current);
      }, 700);
    };

    // scheme = what RN's Appearance reports (diagnoses whether a simctl
    // appearance flip even reaches app processes on this simulator).
    console.log('[ui-tour] started', Date.now(), 'scheme', Appearance.getColorScheme());
    const timers: ReturnType<typeof setTimeout>[] = PROFILE_TOUR
      ? [
          // achievements first: '/(profile)' resolves to the ambiguous '/'
          // and no-ops when pushed from the map, but pops to the profile
          // index when pushed from inside the profile stack.
          setTimeout(
            step('achievements', () => routerRef.current.push('/(profile)/achievements')),
            4_000,
          ),
          // Dark capture: flips the manual theme override (the exact store
          // call Profile → Appearance → Dark makes), since the sim's system
          // appearance never reaches RN's listener. Restored at +22s so a
          // finished run leaves themeMode back on 'system'.
          setTimeout(() => {
            console.log('[ui-tour] dark-on', Date.now());
            useSettingsStore.getState().setThemeMode('dark');
          }, 5_000),
          setTimeout(step('profile', () => routerRef.current.push('/(profile)')), 14_000),
          setTimeout(() => {
            console.log('[ui-tour] dark-off', Date.now());
            useSettingsStore.getState().setThemeMode('system');
          }, 22_000),
        ]
      : [
          setTimeout(step('openSheet', () => controlsRef.current.openSheet()), 8_000),
          setTimeout(step('closeSheet', () => controlsRef.current.closeSheet()), 17_000),
          setTimeout(step('week', () => controlsRef.current.setFilter('week')), 20_000),
          setTimeout(step('all', () => controlsRef.current.setFilter('all')), 25_000),
          setTimeout(step('today', () => controlsRef.current.setFilter('today')), 29_000),
          setTimeout(step('list', () => controlsRef.current.setMode('list')), 34_000),
          setTimeout(
            step('detail', () => {
              const first = controlsRef.current.events[0];
              if (first) {
                routerRef.current.push({
                  pathname: '/(explore)/event/[id]',
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
