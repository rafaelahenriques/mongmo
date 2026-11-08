import { useEffect } from 'react';

import { useSystemContrastStore } from '@/state/systemContrastStore';

/** Follows the browser's prefers-contrast: more. Mount once. */
export function useWatchSystemContrast() {
  const setHigh = useSystemContrastStore((state) => state.setHigh);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-contrast: more)');
    setHigh(query.matches);
    const onChange = (event: MediaQueryListEvent) => setHigh(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [setHigh]);
}
