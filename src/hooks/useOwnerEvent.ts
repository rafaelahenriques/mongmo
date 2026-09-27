import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createEvent,
  getEventQrToken,
  getOwnerEvent,
  setEventStatus,
  updateEvent,
  type OwnerEventInput,
} from '@/api/owner';

/** A single event for the owner edit form. */
export function useOwnerEvent(eventId: string) {
  return useQuery({
    queryKey: ['owner', 'event', eventId],
    queryFn: () => getOwnerEvent(eventId),
    enabled: eventId.length > 0,
  });
}

function useInvalidateOwnerEvents() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['owner', 'events'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };
}

export function useCreateEvent() {
  const invalidate = useInvalidateOwnerEvents();
  return useMutation({
    mutationFn: (input: OwnerEventInput) => createEvent(input),
    onSuccess: invalidate,
  });
}

export function useUpdateEvent(eventId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateOwnerEvents();
  return useMutation({
    mutationFn: (input: OwnerEventInput) => updateEvent(eventId, input),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['owner', 'event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
}

export function useSetEventStatus(eventId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateOwnerEvents();
  return useMutation({
    mutationFn: (status: 'ended' | 'cancelled') => setEventStatus(eventId, status),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['owner', 'event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
}

/** Owner-only QR token, fetched lazily (only while the QR screen is open). */
export function useEventQrToken(eventId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['owner', 'event', eventId, 'qr-token'],
    queryFn: () => getEventQrToken(eventId),
    enabled: enabled && eventId.length > 0,
  });
}
