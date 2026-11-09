import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { addDays, format, parseISO } from 'date-fns';

import { ThemedText } from '@/components/ThemedText';
import { PageInset, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import type { PickupCalendarDay } from '@/utils/pickupSlots';

/**
 * The pickup day as a row of days you can swipe: only the days it's open,
 * each with its weekday ("Today", "Tomorrow", "Thu"), the date big and the
 * month small. The chosen one is sage with an ink ring, so it doesn't rest
 * on colour alone.
 */
export function DayStrip({
  days,
  selected,
  today,
  onSelect,
}: {
  days: PickupCalendarDay[];
  /** yyyy-MM-dd of the chosen day. */
  selected: string;
  /** yyyy-MM-dd of today, in the place's time zone. */
  today: string;
  onSelect: (ymd: string) => void;
}) {
  const theme = useTheme();
  const tomorrow = format(addDays(parseISO(today), 1), 'yyyy-MM-dd');
  const open = days.filter((day) => day.slots.length);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}
      accessibilityRole="radiogroup"
      accessibilityLabel="Pickup day"
    >
      {open.map((day) => {
        const date = parseISO(day.ymd);
        const chosen = day.ymd === selected;
        const word = day.ymd === today ? 'Today' : day.ymd === tomorrow ? 'Tomorrow' : format(date, 'EEE');
        const color = chosen ? theme.onBrand : theme.text;
        return (
          <Pressable
            key={day.ymd}
            onPress={() => {
              haptics.select();
              onSelect(day.ymd);
            }}
            accessibilityRole="radio"
            aria-checked={chosen}
            accessibilityLabel={`${day.ymd === today ? 'Today, ' : day.ymd === tomorrow ? 'Tomorrow, ' : ''}${format(date, 'EEEE d MMMM')}`}
            style={({ pressed }) => [
              styles.day,
              {
                backgroundColor: chosen ? theme.brandFill : theme.backgroundSelected,
                borderColor: chosen ? theme.text : 'transparent',
                transform: [{ scale: pressed ? 0.96 : 1 }],
              },
            ]}
          >
            <ThemedText type="captionBold" style={{ color }}>
              {word}
            </ThemedText>
            <ThemedText type="subtitle" style={{ color }}>
              {format(date, 'd')}
            </ThemedText>
            <ThemedText type="caption" style={{ color: chosen ? theme.onBrand : theme.textSecondary }}>
              {format(date, 'MMM')}
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
  },
  day: {
    minWidth: 68,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: Radius.large,
    borderWidth: 2,
    alignItems: 'center',
    gap: 2,
  },
});
