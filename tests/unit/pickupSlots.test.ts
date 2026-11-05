import { formatInTimeZone } from 'date-fns-tz';

import type { WeeklyHours } from '@/types';
import { pickupDays, pickupSlots, STORE_DAYS_AHEAD, type PickupPlace } from '@/utils/pickupSlots';

const ZONE = 'Europe/Brussels';
const HOURS: WeeklyHours = {
  mon: null,
  tue: null,
  wed: null,
  thu: { open: '10:00', close: '18:00' },
  fri: { open: '10:00', close: '18:00' },
  sat: { open: '10:00', close: '18:00' },
  sun: { open: '10:00', close: '16:00' },
};
const CAFE: PickupPlace = { kind: 'store', hours: HOURS, timeZone: ZONE };

/** Brussels wall-clock times, so the tests read like the café's day. */
const local = (date: Date) => formatInTimeZone(date, ZONE, 'EEE HH:mm');
const times = (slots: Date[]) => slots.map(local);

// Thursday 5 November 2026; Brussels is UTC+1 in November.
const thursdayAt = (hhmm: string) => new Date(`2026-11-05T${hhmm}:00+01:00`);

describe('pickupSlots at the café', () => {
  it('offers every quarter from opening to a quarter before closing', () => {
    const slots = times(pickupSlots(CAFE, 'today', thursdayAt('08:00')));
    expect(slots[0]).toBe('Thu 10:00');
    expect(slots.at(-1)).toBe('Thu 17:45');
    expect(slots).toHaveLength(32);
  });

  it('needs a quarter of an hour to make the order, rounded up to the next quarter', () => {
    expect(local(pickupSlots(CAFE, 'today', thursdayAt('12:07'))[0]!)).toBe('Thu 12:30');
    expect(local(pickupSlots(CAFE, 'today', thursdayAt('12:00'))[0]!)).toBe('Thu 12:15');
  });

  it('has nothing left near closing time', () => {
    expect(pickupSlots(CAFE, 'today', thursdayAt('17:31'))).toEqual([]);
  });

  it("follows tomorrow's hours, and closed days have none", () => {
    const sunday = times(pickupSlots(CAFE, 'tomorrow', new Date('2026-11-07T12:00:00+01:00')));
    expect(sunday[0]).toBe('Sun 10:00');
    expect(sunday.at(-1)).toBe('Sun 15:45');
    expect(pickupSlots(CAFE, 'tomorrow', new Date('2026-11-08T12:00:00+01:00'))).toEqual([]);
  });
});

describe('pickupSlots at a pop-up', () => {
  const popUp: PickupPlace = {
    kind: 'event',
    startsAt: '2026-11-05T17:00:00+01:00',
    endsAt: '2026-11-05T23:00:00+01:00',
    timeZone: ZONE,
  };

  it('offers times only within the pop-up, today', () => {
    const slots = times(pickupSlots(popUp, 'today', thursdayAt('18:02')));
    expect(slots[0]).toBe('Thu 18:30');
    expect(slots.at(-1)).toBe('Thu 22:45');
  });

  it('takes no orders for tomorrow', () => {
    expect(pickupSlots(popUp, 'tomorrow', thursdayAt('12:00'))).toEqual([]);
  });
});

describe('pickupDays', () => {
  it('lists two weeks of café days, closed days with no times', () => {
    const days = pickupDays(CAFE, thursdayAt('08:00'));
    expect(days).toHaveLength(STORE_DAYS_AHEAD);
    expect(days[0]!.ymd).toBe('2026-11-05');
    expect(days.find((day) => day.ymd === '2026-11-09')!.slots).toEqual([]);
  });

  it('never skips or repeats a day across the clocks going back', () => {
    // Brussels leaves summer time on Sunday 25 October 2026.
    const days = pickupDays(CAFE, new Date('2026-10-20T12:00:00+02:00')).map((day) => day.ymd);
    expect(new Set(days).size).toBe(STORE_DAYS_AHEAD);
    expect(days).toContain('2026-10-25');
    expect(days).toContain('2026-10-26');
    expect(days.at(-1)).toBe('2026-11-02');
  });

  it('splits a pop-up night that runs past midnight into its two days', () => {
    const night: PickupPlace = {
      kind: 'event',
      startsAt: '2026-11-06T22:00:00+01:00',
      endsAt: '2026-11-07T02:00:00+01:00',
      timeZone: ZONE,
    };
    const days = pickupDays(night, thursdayAt('12:00'));
    expect(days.map((day) => day.ymd)).toEqual(['2026-11-06', '2026-11-07']);
    expect(local(days[1]!.slots.at(-1)!)).toBe('Sat 01:45');
  });
});
