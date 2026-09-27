import { StyleSheet, View } from 'react-native';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useResolvedScheme, useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { fromWallClock, toWallClock } from '@/utils/dateTime';
import type { DateTimeFieldProps } from './types';

/** iOS: the system's compact date and time pills, which open the native calendar and wheel. */
export function DateTimeField({ label, value, onChange, timeZone, minimumDate }: DateTimeFieldProps) {
  const theme = useTheme();
  const scheme = useResolvedScheme();

  return (
    <View style={styles.row} accessible={false}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
        {label}
      </ThemedText>
      <DateTimePicker
        value={toWallClock(value, timeZone)}
        minimumDate={minimumDate ? toWallClock(minimumDate, timeZone) : undefined}
        mode="datetime"
        display="compact"
        style={styles.picker}
        accentColor={theme.brandFill}
        themeVariant={scheme}
        onValueChange={(_, date) => {
          haptics.select();
          onChange(fromWallClock(date, timeZone));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    minHeight: 44,
  },
  label: {
    flexShrink: 1,
  },
  // The SwiftUI host sizes its height to the pills; the width is ours to give.
  picker: {
    flex: 1,
  },
});
