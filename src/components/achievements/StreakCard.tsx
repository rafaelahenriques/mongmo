import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type StreakCardProps = {
  currentDays: number;
  longestDays: number;
};

/** "Visited 5 days in a row 🔥" card with the all-time best alongside. */
export default function StreakCard({ currentDays, longestDays }: StreakCardProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={
        currentDays > 0
          ? `Visited ${currentDays} days in a row. Longest streak ${longestDays} days.`
          : 'No active streak. Check in today to start one.'
      }
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
      ]}
    >
      <ThemedText style={styles.flame}>{currentDays > 0 ? '🔥' : '💤'}</ThemedText>
      <View style={styles.texts}>
        <ThemedText type="smallBold">
          {currentDays > 0 ? `Visited ${currentDays} day${currentDays === 1 ? '' : 's'} in a row 🔥` : 'Start a streak today'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {currentDays > 0
            ? `Longest run: ${longestDays} day${longestDays === 1 ? '' : 's'}`
            : 'Check in at an event to light the fire'}
        </ThemedText>
      </View>
      <View style={styles.longestBox}>
        <ThemedText type="subtitle" style={styles.longestNumber}>
          {longestDays}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          best
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
  flame: {
    fontSize: 32,
    lineHeight: 38,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  longestBox: {
    alignItems: 'center',
    minWidth: 52,
  },
  longestNumber: {
    fontSize: 24,
    lineHeight: 30,
  },
});
