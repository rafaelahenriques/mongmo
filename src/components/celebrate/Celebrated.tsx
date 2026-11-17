import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Burst } from '@/components/celebrate/Burst';
import { PopIn } from '@/components/celebrate/PopIn';

/**
 * A task done (an order placed, a check-in, a challenge): when `play`, what
 * it wraps pops in with a short burst over it. Otherwise it's just there,
 * as when you come back to it later.
 */
export function Celebrated({
  play,
  colors,
  children,
  from = 0.85,
  distance = 160,
  delay = 0,
  style,
}: {
  play: boolean;
  /** The burst's colours. */
  colors: string[];
  children: ReactNode;
  /** The size it pops in from. */
  from?: number;
  distance?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  if (!play) return <View style={style}>{children}</View>;
  return (
    <View style={style}>
      <PopIn from={from} delay={delay}>
        {children}
      </PopIn>
      <Burst colors={colors} distance={distance} delay={delay + 150} />
    </View>
  );
}
