import { Image } from 'expo-image';
import type { StyleProp, ImageStyle } from 'react-native';

/**
 * One of Mongmo's stickers (src/constants/stickers.ts), drawn whole in its
 * box. Always decorative: hidden from screen readers, and an empty alt on
 * the web, because the words beside it say what it is.
 */
export function Sticker({ source, style }: { source: number; style?: StyleProp<ImageStyle> }) {
  return <Image source={source} contentFit="contain" style={style} accessible={false} accessibilityLabel="" />;
}
