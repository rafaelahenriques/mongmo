import { create } from 'zustand';

/**
 * Whether the phone or browser asks for more contrast (iOS Increase
 * Contrast, Android high contrast text, the web's prefers-contrast: more).
 * Kept up to date by useWatchSystemContrast, mounted once in the root
 * layout, so every useTheme reads one value instead of each listening.
 */
export const useSystemContrastStore = create<{ high: boolean; setHigh: (high: boolean) => void }>((set) => ({
  high: false,
  setHigh: (high) => set({ high }),
}));
