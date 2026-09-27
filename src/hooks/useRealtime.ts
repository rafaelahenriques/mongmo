import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import type { RealtimeStatus } from '@/realtime/types';
import { useBusyStore } from '@/state/busyStore';

type OccupancyRow = { id: string; occupancy: number };

/**
 * Subscribes to live "how busy" numbers for the lifetime of the app (called
 * once from Providers): Supabase Realtime pushes a postgres_changes event
 * whenever a store or event's `occupancy` column changes. Updates land in
 * `useBusyStore`, which pins, sheets and cards read through fine-grained
 * selectors — no manual refresh anywhere.
 */
export function useRealtime(): RealtimeStatus {
  const status = useBusyStore((state) => state.status);
  const setOccupancy = useBusyStore((state) => state.setOccupancy);
  const setStatus = useBusyStore((state) => state.setStatus);

  useEffect(() => {
    const onUpdate = (row: OccupancyRow) => setOccupancy(row.id, row.occupancy);

    const channel = supabase
      .channel('busy-counts')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'stores' },
        (payload) => onUpdate(payload.new as OccupancyRow),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events' },
        (payload) => onUpdate(payload.new as OccupancyRow),
      )
      .subscribe((channelStatus) => {
        setStatus(channelStatus === 'SUBSCRIBED' ? 'live' : 'connecting');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setOccupancy, setStatus]);

  return status;
}
