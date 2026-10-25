import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import animation from '@/assets/animations/mongmo-intro.json';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { layerOpacity, layerTransform, parseLottie, type LottieLayer } from '@/utils/lottie';

// The native splash is a plain screen in the same color as the intro's
// background (and its empty first frame); it stays up until the intro has
// laid out, so launch reads as one continuous animation.
SplashScreen.preventAutoHideAsync();

const intro = parseLottie(animation);
/** The comp's out point is exclusive: its last frame is the finished logo. */
const LAST_FRAME = intro.outFrame - 1;
/**
 * The most one UI frame can advance the intro. A longer stall (the app
 * mounting underneath, say) pauses it rather than skipping part of it.
 */
const MAX_STEP_MS = 1000 / 30;
const FADE_OUT_MS = 300;
/** With Reduce Motion on, the finished logo shows for this long instead of the animation. */
const STILL_MS = 800;

type SplashIntroProps = {
  /** Whether the app underneath has loaded; the intro plays once it has. */
  ready: boolean;
  onDone: () => void;
};

/**
 * Launch overlay playing the Mongmo logo animation (After Effects, exported
 * to Lottie) once the app underneath has loaded, then fading out over it.
 * Until then it shows the animation's empty first frame, like the splash.
 */
export function SplashIntro({ ready, onDone }: SplashIntroProps) {
  // The device's scheme, not the in-app override: the native splash before
  // this can only follow the device, and the fade-out reveals the app's own.
  const background = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'].background;
  const reduceMotion = useReducedMotion();
  const { height } = useWindowDimensions();
  const frame = useSharedValue(intro.inFrame);
  const opacity = useSharedValue(1);
  const [laidOut, setLaidOut] = useState(false);
  const [played, setPlayed] = useState(false);

  const clock = useFrameCallback(({ timeSincePreviousFrame }) => {
    if (frame.value >= LAST_FRAME) return;
    const step = Math.min(timeSincePreviousFrame ?? 0, MAX_STEP_MS);
    frame.value = Math.min(frame.value + (step / 1000) * intro.frameRate, LAST_FRAME);
    if (frame.value === LAST_FRAME) scheduleOnRN(setPlayed, true);
  }, false);

  const onLayout = () => {
    if (laidOut) return;
    SplashScreen.hide();
    setLaidOut(true);
  };

  // Starting only once the app has loaded keeps its first render, which can
  // block the UI thread for a moment, out of the opening frames.
  useEffect(() => {
    if (!laidOut || !ready) return;
    if (!reduceMotion) {
      clock.setActive(true);
      return;
    }
    frame.set(LAST_FRAME);
    const timer = setTimeout(() => setPlayed(true), STILL_MS);
    return () => clearTimeout(timer);
  }, [laidOut, ready, reduceMotion, clock, frame]);

  useEffect(() => {
    if (!played) return;
    // A cross-fade, not motion, so it runs with Reduce Motion on too.
    opacity.set(
      withTiming(0, { duration: FADE_OUT_MS, reduceMotion: ReduceMotion.Never }, (finished) => {
        if (finished) scheduleOnRN(onDone);
      }),
    );
  }, [played, opacity, onDone]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  // Fill the screen's height like a full-bleed portrait video: on phones
  // taller than 9:16 the comp's sides crop (the logo still fits), and what
  // waits above it, like the hat before it drops, stays off screen.
  const scale = height / intro.height;

  return (
    <Animated.View
      onLayout={onLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Mongmo"
      accessibilityViewIsModal
      style={[styles.overlay, { backgroundColor: background }, fadeStyle]}
    >
      <View style={[styles.comp, { transform: [{ scale }] }]}>
        {intro.layers.map((layer) => (
          <IntroLayer key={layer.index} layer={layer} frame={frame} />
        ))}
      </View>
    </Animated.View>
  );
}

function IntroLayer({ layer, frame }: { layer: LottieLayer; frame: SharedValue<number> }) {
  const { motion, paths, bounds } = layer;
  const style = useAnimatedStyle(() => ({
    opacity: layerOpacity(motion, frame.value),
    transform: layerTransform(motion, frame.value),
  }));

  return (
    <Animated.View style={[styles.layer, style]}>
      <Svg
        style={{ position: 'absolute', left: bounds.x, top: bounds.y }}
        width={bounds.width}
        height={bounds.height}
        viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
      >
        {paths.map((path, index) => (
          <Path key={index} d={path.d} fill={path.fill} fillOpacity={path.fillOpacity} fillRule={path.fillRule} />
        ))}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  comp: {
    width: intro.width,
    height: intro.height,
  },
  /** Zero-size, so transforms pivot on the layer's own 0,0 as in After Effects. */
  layer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  },
});
