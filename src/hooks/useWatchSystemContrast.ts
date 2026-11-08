import { useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

import { useSystemContrastStore } from '@/state/systemContrastStore';

/** Follows iOS Increase Contrast and Android high contrast text. Mount once. */
export function useWatchSystemContrast() {
  const setHigh = useSystemContrastStore((state) => state.setHigh);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    let alive = true;
    (ios ? AccessibilityInfo.isDarkerSystemColorsEnabled() : AccessibilityInfo.isHighTextContrastEnabled())
      .then((high) => {
        if (alive) setHigh(high);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener(
      ios ? 'darkerSystemColorsChanged' : 'highTextContrastChanged',
      setHigh,
    );
    return () => {
      alive = false;
      subscription.remove();
    };
  }, [setHigh]);
}
