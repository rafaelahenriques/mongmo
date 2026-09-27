import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { formatInTimeZone } from 'date-fns-tz';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';

import { ThemedText } from '@/components/ThemedText';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { fromWallClock, toWallClock } from '@/utils/dateTime';
import type { DateTimeFieldProps } from './types';

/** Android: date and time pills that open the Material date and time dialogs. */
export function DateTimeField({ label, value, onChange, timeZone, minimumDate }: DateTimeFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState<'date' | 'time' | null>(null);

  const pill = (mode: 'date' | 'time', text: string, accessibilityLabel: string) => (
    <Pressable
      onPress={() => {
        haptics.tap();
        setOpen(mode);
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.pill, { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 }]}
    >
      <ThemedText type="smallBold">{text}</ThemedText>
    </Pressable>
  );

  return (
    <View style={styles.row}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
        {label}
      </ThemedText>
      <View style={styles.pills}>
        {pill('date', formatInTimeZone(value, timeZone, 'EEE d MMM'), `${label} date`)}
        {pill('time', formatInTimeZone(value, timeZone, 'HH:mm'), `${label} time`)}
      </View>
      {open ? (
        <DateTimePicker
          value={toWallClock(value, timeZone)}
          minimumDate={minimumDate ? toWallClock(minimumDate, timeZone) : undefined}
          mode={open}
          is24Hour
          accentColor={theme.brandFill}
          onValueChange={(_, date) => {
            setOpen(null);
            haptics.select();
            onChange(fromWallClock(date, timeZone));
          }}
          onDismiss={() => setOpen(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  label: {
    flexShrink: 1,
  },
  pills: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  pill: {
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.three,
    minHeight: 40,
    justifyContent: 'center',
  },
});
