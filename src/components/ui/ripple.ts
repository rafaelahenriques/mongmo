import { Platform, type PressableAndroidRippleConfig } from 'react-native';

/**
 * Android's touch feedback, Material's pressed state: a ripple in the
 * content's colour at 12 % over the control. iOS and the web keep their own
 * (the shrink or fade each component already has), so this is undefined
 * there.
 */
export function ripple(contentColor: string): PressableAndroidRippleConfig | undefined {
  if (Platform.OS !== 'android') return undefined;
  // #RRGGBB → #RRGGBBAA; 0x1F is 12 %.
  const color = /^#[0-9a-f]{6}$/i.test(contentColor) ? `${contentColor}1F` : contentColor;
  return { color, foreground: true };
}
