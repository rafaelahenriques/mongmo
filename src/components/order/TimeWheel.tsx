import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

/**
 * A three-line time picker: the chosen time big between two rules, the
 * one before and after faded above and below. Tap a faded one (or swipe
 * with a screen reader) to move.
 */
export function TimeWheel({
  times,
  index,
  onChange,
}: {
  times: string[];
  index: number;
  onChange: (index: number) => void;
}) {
  const theme = useTheme();
  const go = (next: number) => {
    if (next < 0 || next >= times.length) return;
    haptics.select();
    onChange(next);
  };
  const before = times[index - 1];
  const after = times[index + 1];

  return (
    <View
      style={styles.wheel}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Pickup time"
      accessibilityValue={{ text: times[index] }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => go(event.nativeEvent.actionName === 'increment' ? index + 1 : index - 1)}
    >
      <Pressable onPress={() => go(index - 1)} disabled={!before} style={styles.side} importantForAccessibility="no">
        <ThemedText type="small" style={{ color: theme.faded }}>
          {before ?? ' '}
        </ThemedText>
      </Pressable>
      <View style={[styles.current, { borderColor: theme.text }]}>
        <ThemedText type="subtitle">{times[index]}</ThemedText>
      </View>
      <Pressable onPress={() => go(index + 1)} disabled={!after} style={styles.side} importantForAccessibility="no">
        <ThemedText type="small" style={{ color: theme.faded }}>
          {after ?? ' '}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wheel: {
    alignItems: 'stretch',
  },
  side: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  current: {
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    paddingVertical: 8,
  },
});
