import AsyncStorage from '@react-native-async-storage/async-storage';
import { format as formatZoned, fromZonedTime } from 'date-fns-tz';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CheckInRecord, Reward } from '@/types';
import { ACTIVITY_TIME_ZONE, totalPoints } from '@/utils/achievements';

/**
 * Locally recorded activity: event check-ins, shares and reward redemptions.
 * Persisted to AsyncStorage so points, streaks, badges and the photo gallery
 * survive relaunches. (`redemptions` records what was spent so the balance in
 * utils/achievements stays the single source of truth for points.)
 */
export type ShareRecord = {
  eventId: string;
  sharedAt: string;
};

export type Redemption = {
  rewardId: string;
  title: string;
  costPoints: number;
  redeemedAt: string;
};

type ActivityState = {
  checkIns: CheckInRecord[];
  shares: ShareRecord[];
  redemptions: Redemption[];
  /** Returns false when this event was already checked in (no double points). */
  addCheckIn: (record: CheckInRecord) => boolean;
  /** Returns false when this event was already shared. */
  recordShare: (eventId: string) => boolean;
  /** Spends points; returns false when the balance is too low. */
  redeemReward: (reward: Reward) => boolean;
  clearActivity: () => void;
};

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      checkIns: [],
      shares: [],
      redemptions: [],

      addCheckIn: (record) => {
        if (get().checkIns.some((checkIn) => checkIn.eventId === record.eventId)) return false;
        set((state) => ({ checkIns: [...state.checkIns, record] }));
        return true;
      },

      recordShare: (eventId) => {
        if (get().shares.some((share) => share.eventId === eventId)) return false;
        set((state) => ({
          shares: [...state.shares, { eventId, sharedAt: new Date().toISOString() }],
        }));
        return true;
      },

      redeemReward: (reward) => {
        const state = get();
        const balance = totalPoints({
          checkIns: state.checkIns,
          shares: state.shares,
          redemptions: state.redemptions,
        });
        if (balance < reward.costPoints) return false;
        set((current) => ({
          redemptions: [
            ...current.redemptions,
            {
              rewardId: reward.id,
              title: reward.title,
              costPoints: reward.costPoints,
              redeemedAt: new Date().toISOString(),
            },
          ],
        }));
        return true;
      },

      clearActivity: () => set({ checkIns: [], shares: [], redemptions: [] }),
    }),
    {
      name: 'mongmo-activity',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        checkIns: state.checkIns,
        shares: state.shares,
        redemptions: state.redemptions,
      }),
      onRehydrateStorage: () => (state) => {
        // Capture aid (same flag as useUiTour): screenshot runs cannot tap
        // "Check in", so seeded activity demonstrates populated badges,
        // streaks and gallery. Never runs in a normal build.
        if (state && process.env.EXPO_PUBLIC_UI_TOUR === '1' && state.checkIns.length === 0) {
          useActivityStore.setState((current) =>
            current.checkIns.length === 0
              ? { checkIns: demoCheckIns(), shares: demoShares() }
              : {},
          );
        }
      },
    },
  ),
);

/** ISO instant for `daysAgo` days ago at `hh:mm` Europe/Brussels wall clock. */
function demoInstant(daysAgo: number, hhmm: string): string {
  const day = formatZoned(new Date().getTime() - daysAgo * 86_400_000, 'yyyy-MM-dd', {
    timeZone: ACTIVITY_TIME_ZONE,
  });
  return fromZonedTime(`${day}T${hhmm}:00`, ACTIVITY_TIME_ZONE).toISOString();
}

function demoCheckIns(): CheckInRecord[] {
  return [
    {
      eventId: 'bar-amorse-2026-09-27',
      title: 'Bar Amorse × Mongmo',
      city: 'Kortrijk',
      imageUrl:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      startsAt: demoInstant(0, '12:00'),
      checkedInAt: demoInstant(0, '13:40'),
    },
    {
      eventId: 'demo-night-market',
      title: 'Kortrijk Night Market',
      city: 'Kortrijk',
      imageUrl:
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      startsAt: demoInstant(1, '18:00'),
      checkedInAt: demoInstant(1, '22:15'),
    },
    {
      eventId: 'demo-gent-market',
      title: 'Gent Winter Pop-up',
      city: 'Ghent',
      imageUrl:
        'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=800&q=80',
      startsAt: demoInstant(2, '14:00'),
      checkedInAt: demoInstant(2, '15:20'),
    },
    {
      eventId: 'demo-bakery-class',
      title: 'Bánh mì workshop',
      city: 'Kortrijk',
      imageUrl:
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
      startsAt: demoInstant(3, '10:00'),
      checkedInAt: demoInstant(3, '11:05'),
    },
    {
      eventId: 'demo-rooftop-session',
      title: 'Rooftop coffee session',
      city: 'Kortrijk',
      imageUrl:
        'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=800&q=80',
      startsAt: demoInstant(4, '11:00'),
      checkedInAt: demoInstant(4, '11:45'),
    },
  ];
}

function demoShares(): ShareRecord[] {
  return [{ eventId: 'bar-amorse-2026-09-27', sharedAt: demoInstant(0, '13:45') }];
}
