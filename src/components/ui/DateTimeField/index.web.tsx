import { StyleSheet, View } from 'react-native';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

import { ThemedText } from '@/components/ThemedText';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { DateTimeFieldProps } from './types';

/** Web: the browser's own date and time inputs. */
export function DateTimeField({ label, value, onChange, timeZone, minimumDate }: DateTimeFieldProps) {
  const theme = useTheme();
  const date = formatInTimeZone(value, timeZone, 'yyyy-MM-dd');
  const time = formatInTimeZone(value, timeZone, 'HH:mm');

  const update = (nextDate: string, nextTime: string) => {
    if (!nextDate || !nextTime) return;
    const next = fromZonedTime(`${nextDate}T${nextTime}`, timeZone);
    if (!Number.isNaN(next.getTime())) onChange(next);
  };

  const inputStyle = {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: theme.text,
    backgroundColor: theme.backgroundSelected,
    border: 'none',
    borderRadius: Radius.small,
    padding: '10px 12px',
    colorScheme: 'light dark',
  } as const;

  return (
    <View style={styles.row}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
        {label}
      </ThemedText>
      <View style={styles.inputs}>
        <input
          type="date"
          aria-label={`${label} date`}
          value={date}
          min={minimumDate ? formatInTimeZone(minimumDate, timeZone, 'yyyy-MM-dd') : undefined}
          onChange={(event) => update(event.target.value, time)}
          style={inputStyle}
        />
        <input
          type="time"
          aria-label={`${label} time`}
          value={time}
          onChange={(event) => update(date, event.target.value)}
          style={inputStyle}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  label: {
    flexShrink: 1,
  },
  inputs: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
