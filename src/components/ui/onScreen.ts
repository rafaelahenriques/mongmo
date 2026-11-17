import { Dimensions, type View } from 'react-native';
import type { ComponentRef } from 'react';

/**
 * Calls `then` if `view` is wholly inside the window (scrolled into view);
 * a view that can't be measured counts as on screen.
 */
export function onScreen(view: ComponentRef<typeof View> | null, then: () => void): void {
  if (!view || typeof view.measureInWindow !== 'function') {
    then();
    return;
  }
  view.measureInWindow((_x, y, _width, height) => {
    if (height > 0 && y >= 0 && y + height <= Dimensions.get('window').height) then();
  });
}
