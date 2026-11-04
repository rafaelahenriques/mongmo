import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/**
 * Progress through a few named steps (Confirmed · Being made · Ready): an
 * ink rule over each step reached, a stone rule over the rest.
 */
export function StepBar({ steps, reached }: { steps: string[]; reached: number }) {
  const theme = useTheme();
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Step ${Math.min(reached + 1, steps.length)} of ${steps.length}: ${steps[Math.min(reached, steps.length - 1)]}`}
    >
      {steps.map((step, index) => {
        const done = index <= reached;
        return (
          <View key={step} style={styles.step}>
            <View style={[styles.rule, { backgroundColor: done ? theme.text : theme.border }]} />
            <ThemedText
              type="micro"
              numberOfLines={1}
              style={[done ? styles.done : null, { color: done ? theme.text : theme.textSecondary }]}
            >
              {step}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  step: {
    flex: 1,
    gap: 5,
  },
  rule: {
    height: 3,
  },
  done: {
    fontFamily: FontFamily.bodySemiBold,
  },
});
