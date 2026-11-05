import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { addMonths, format, getDaysInMonth, parseISO } from 'date-fns';

import { ThemedText } from '@/components/ThemedText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import type { PickupCalendarDay } from '@/utils/pickupSlots';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** "2026-11" from "2026-11-05". */
const monthOf = (ymd: string) => ymd.slice(0, 7);

/**
 * A month calendar for the pickup day, weeks starting on Monday: the days
 * you can pick up on are dark and tappable, the rest faded (closed, past,
 * or too far ahead); the chosen day has a sage circle ringed in ink (so it
 * doesn't rely on colour alone) and today a dot.
 * Arrows move between months when the days run into the next one.
 */
export function PickupCalendar({
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
  const open = useMemo(() => new Set(days.filter((day) => day.slots.length).map((day) => day.ymd)), [days]);
  const months = useMemo(() => [...new Set(days.map((day) => monthOf(day.ymd)))], [days]);
  const [shown, setShown] = useState(monthOf(selected));
  const month = months.includes(shown) ? shown : (months[0] ?? monthOf(selected));
  const at = months.indexOf(month);

  // Monday-first grid: blanks before the 1st, then each day of the month.
  const first = parseISO(`${month}-01`);
  const lead = (first.getDay() + 6) % 7;
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: getDaysInMonth(first) }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`),
  ];
  while (cells.length % 7) cells.push(null);

  const move = (by: number) => {
    const next = format(addMonths(first, by), 'yyyy-MM');
    if (!months.includes(next)) return;
    haptics.select();
    setShown(next);
  };

  return (
    <View style={styles.calendar}>
      <View style={styles.head}>
        <ThemedText type="section" accessibilityRole="header" headingLevel={2} style={styles.flex}>
          {format(first, 'MMMM yyyy')}
        </ThemedText>
        {months.length > 1 ? (
          <>
            <MonthArrow icon="chevronLeft" label="Previous month" disabled={at <= 0} onPress={() => move(-1)} />
            <MonthArrow
              icon="chevronRight"
              label="Next month"
              disabled={at >= months.length - 1}
              onPress={() => move(1)}
            />
          </>
        ) : null}
      </View>

      <View style={styles.week}>
        {WEEKDAYS.map((day, index) => (
          <ThemedText key={index} type="micro" themeColor="textSecondary" style={styles.weekday}>
            {day}
          </ThemedText>
        ))}
      </View>

      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={styles.week}>
          {cells.slice(row * 7, row * 7 + 7).map((ymd, index) => {
            if (!ymd) return <View key={index} style={styles.cell} />;
            const available = open.has(ymd);
            const chosen = ymd === selected;
            const date = parseISO(ymd);
            return (
              <Pressable
                key={ymd}
                onPress={() => {
                  haptics.select();
                  onSelect(ymd);
                }}
                disabled={!available}
                accessibilityRole="button"
                accessibilityLabel={`${format(date, 'EEEE d MMMM')}${ymd === today ? ', today' : ''}${
                  available ? '' : ', no pickup'
                }`}
                aria-pressed={chosen}
                aria-disabled={!available}
                style={styles.cell}
              >
                <View style={[styles.day, chosen && { backgroundColor: theme.brandFill, borderColor: theme.text }]}>
                  <ThemedText
                    type={available ? 'smallBold' : 'small'}
                    style={{ color: chosen ? theme.onBrand : available ? theme.text : theme.faded }}
                  >
                    {date.getDate()}
                  </ThemedText>
                </View>
                {ymd === today ? <View style={[styles.dot, { backgroundColor: theme.text }]} /> : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function MonthArrow({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'chevronLeft' | 'chevronRight';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-disabled={disabled}
      hitSlop={8}
      style={styles.arrow}
    >
      <Icon name={icon} size={18} color={disabled ? theme.faded : theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  calendar: {
    gap: 4,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 6,
  },
  flex: {
    flex: 1,
  },
  arrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  week: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
  },
  cell: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    minWidth: 40,
    minHeight: 40,
    paddingHorizontal: 4,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    bottom: 1,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
