import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, type ScrollViewInstance } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { PageInset } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

/** One pill's width plus the gap, for scrolling the chosen one into view. */
const STEP = 84 + 8;

/**
 * Pickup times as a row of pills that scrolls sideways: tap one to choose
 * it; the chosen one is sage. Runs edge to edge under the page's margins.
 */
export function TimePills({
  times,
  index,
  onChange,
}: {
  times: string[];
  index: number;
  onChange: (index: number) => void;
}) {
  const theme = useTheme();
  const scroller = useRef<ScrollViewInstance>(null);

  // Keep the chosen time on screen when the day (and so the list) changes.
  useEffect(() => {
    scroller.current?.scrollTo({ x: Math.max(0, (index - 1) * STEP), animated: false });
  }, [times, index]);

  return (
    <ScrollView
      ref={scroller}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}
      accessibilityRole="radiogroup"
      accessibilityLabel="Pickup time"
    >
      {times.map((time, i) => {
        const on = i === index;
        return (
          <Pressable
            key={time}
            onPress={() => {
              haptics.select();
              onChange(i);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`Pick up at ${time}`}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: on ? theme.brandFill : theme.backgroundElement,
                borderColor: on ? theme.brandFill : theme.outline,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <ThemedText type="smallBold" style={{ color: on ? theme.onBrand : theme.text }}>
              {time}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: {
    marginHorizontal: -PageInset,
    flexGrow: 0,
  },
  row: {
    gap: 8,
    paddingHorizontal: PageInset,
    paddingVertical: 4,
  },
  pill: {
    width: 84,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
