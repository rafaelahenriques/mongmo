import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatInTimeZone } from 'date-fns-tz';

import { Wordmark } from '@/components/brand/Wordmark';
import FilterBar from '@/components/map/FilterBar';
import OfflineBanner from '@/components/map/OfflineBanner';
import StoreSheet from '@/components/map/StoreSheet';
import ListMode from '@/components/explore/ListMode';
import MapMode from '@/components/explore/MapMode';
import ModeToggle, { type ExploreMode } from '@/components/explore/ModeToggle';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { ColumnRow } from '@/components/ui/ColumnRow';
import { Icon } from '@/components/ui/Icon';
import { PageInset } from '@/constants/theme';
import { useEvents } from '@/hooks/useEvents';
import { useStore } from '@/hooks/useStore';
import { useTheme } from '@/hooks/useTheme';
import { useUiTour } from '@/hooks/useUiTour';
import { openDirections } from '@/services/directions';
import { haptics } from '@/services/haptics';
import { useBusyStore } from '@/state/busyStore';
import { useFilterStore } from '@/state/filterStore';
import { useLocationStore } from '@/state/locationStore';
import { getEventPhase } from '@/utils/dateTime';
import { distanceInMeters, formatDistance } from '@/utils/distance';
import type { PopUpEvent } from '@/types';

/**
 * Pop-ups tab: find one fast. The map with what's on right now underneath
 * (P-01), or the same pop-ups as a list (P-02). The dark switch changes the
 * view; the underlined words filter it.
 */
export default function ExploreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<ExploreMode>('map');
  const [sheetVisible, setSheetVisible] = useState(false);

  const storeQuery = useStore();
  const filter = useFilterStore((state) => state.filter);
  const setFilter = useFilterStore((state) => state.setFilter);
  const eventsQuery = useEvents(filter);
  const coordinates = useLocationStore((state) => state.coordinates);

  const store = storeQuery.data ?? null;
  const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);
  const byDistance = useCallback(
    (a: PopUpEvent, b: PopUpEvent) =>
      coordinates
        ? distanceInMeters(coordinates, a.coordinates) - distanceInMeters(coordinates, b.coordinates)
        : a.startsAt.localeCompare(b.startsAt),
    [coordinates],
  );
  const live = useMemo(
    () => events.filter((event) => getEventPhase(event.startsAt, event.endsAt) === 'live').sort(byDistance)[0],
    [events, byDistance],
  );
  const next = useMemo(
    () =>
      [...events]
        .filter((event) => event.id !== live?.id && getEventPhase(event.startsAt, event.endsAt) === 'upcoming')
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0],
    [events, live],
  );

  const onSelectStore = useCallback(() => setSheetVisible(true), []);
  const onCloseSheet = useCallback(() => setSheetVisible(false), []);
  const onSelectEvent = useCallback(
    (eventId: string) => router.push({ pathname: '/(popups)/event/[id]', params: { id: eventId } }),
    [router],
  );
  const onCheckIn = useCallback(
    (eventId: string) => router.push({ pathname: '/(popups)/check-in/[id]', params: { id: eventId } }),
    [router],
  );

  // No-op unless EXPO_PUBLIC_UI_TOUR=1 (headless screenshot walkthrough).
  useUiTour({ events, openSheet: onSelectStore, closeSheet: onCloseSheet, setFilter, setMode });

  const topRow = (
    <View style={styles.topRow}>
      <Wordmark height={20} />
      <ModeToggle value={mode} onChange={setMode} />
    </View>
  );

  if (mode === 'list') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + 12 }]}>
        <ListMode
          header={
            <View style={styles.listHeader}>
              {topRow}
              <OfflineBanner />
              <ThemedText type="title" accessibilityRole="header" style={styles.listTitle}>
                {events.length === 1 ? '1 Mongmo nearby' : `${events.length} Mongmos nearby`}
              </ThemedText>
              <FilterBar value={filter} onChange={setFilter} />
            </View>
          }
          store={store}
          events={events}
          filter={filter}
          isLoading={eventsQuery.isPending}
          isError={eventsQuery.isError}
          onRetry={() => eventsQuery.refetch()}
          onSelectStore={onSelectStore}
          onSelectEvent={onSelectEvent}
          onCheckIn={onCheckIn}
        />
        <StoreSheet visible={sheetVisible} store={store} onClose={onCloseSheet} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.flex}>
        <MapMode
          store={store}
          storeLoading={storeQuery.isPending && !store}
          storeLoadError={storeQuery.isError && !store}
          onRetryStore={() => storeQuery.refetch()}
          events={events}
          live={live}
          onSelectStore={onSelectStore}
          onSelectEvent={onSelectEvent}
        />
        <View style={[styles.overlay, { top: insets.top + 12 }]} pointerEvents="box-none">
          {topRow}
          <OfflineBanner />
        </View>
      </View>

      <View style={styles.panel}>
        <FilterBar value={filter} onChange={setFilter} />
        <View style={[styles.rule, { backgroundColor: theme.text }]} />
        {eventsQuery.isError ? (
          <View style={styles.message} accessibilityRole="alert">
            <ThemedText type="caption" themeColor="textSecondary">
              Couldn’t load the pop-ups.
            </ThemedText>
            <Button label="Try again" variant="ghost" size="small" onPress={() => eventsQuery.refetch()} />
          </View>
        ) : live ? (
          <LiveNow event={live} index={1} onOpen={onSelectEvent} onCheckIn={onCheckIn} />
        ) : !eventsQuery.isPending && !next ? (
          <ThemedText type="caption" themeColor="textSecondary" style={styles.message}>
            No pop-ups {filter === 'today' ? 'today' : filter === 'week' ? 'this week' : 'planned'}. The café is open as
            usual.
          </ThemedText>
        ) : null}
        {next ? (
          <>
            {live ? <View style={[styles.hairline, { backgroundColor: theme.border }]} /> : null}
            <NextUp event={next} index={live ? 2 : 1} onOpen={onSelectEvent} />
          </>
        ) : null}
      </View>

      <StoreSheet visible={sheetVisible} store={store} onClose={onCloseSheet} />
    </View>
  );
}

/** "Right now¹": the nearest live pop-up, with check in and directions. */
function LiveNow({
  event,
  index,
  onOpen,
  onCheckIn,
}: {
  event: PopUpEvent;
  index: number;
  onOpen: (id: string) => void;
  onCheckIn: (id: string) => void;
}) {
  const coordinates = useLocationStore((state) => state.coordinates);
  const busy = useBusyStore((state) => state.busy[event.id] ?? event.busy);
  const distance = coordinates ? formatDistance(distanceInMeters(coordinates, event.coordinates)) : null;
  const hours = `${formatInTimeZone(new Date(event.startsAt), event.timeZone, 'HH:mm')} – ${formatInTimeZone(new Date(event.endsAt), event.timeZone, 'HH:mm')}`;
  return (
    <ColumnRow label="Right now" index={index}>
      <Pressable onPress={() => onOpen(event.id)} accessibilityRole="button" accessibilityLabel={`${event.title}. Open.`}>
        <ThemedText type="title" numberOfLines={2}>
          {event.title}
        </ThemedText>
      </Pressable>
      <ThemedText type="caption" themeColor="textSecondary">
        {[event.venue, distance].filter(Boolean).join(' · ')}
        {'\n'}
        {hours} · How busy: {busy.occupancy} of {busy.capacity}
      </ThemedText>
      <View style={styles.actions}>
        <Button label="Check in" variant="brand" onPress={() => onCheckIn(event.id)} style={styles.flex} />
        <Button
          label="Directions"
          variant="ghost"
          onPress={() => openDirections(event.coordinates, `${event.title}, ${event.venue}`)}
          style={styles.flex}
        />
      </View>
    </ColumnRow>
  );
}

/** "Next up²": the next pop-up to start, one line and an arrow. */
function NextUp({ event, index, onOpen }: { event: PopUpEvent; index: number; onOpen: (id: string) => void }) {
  const theme = useTheme();
  const coordinates = useLocationStore((state) => state.coordinates);
  const distance = coordinates ? formatDistance(distanceInMeters(coordinates, event.coordinates)) : null;
  const start = new Date(event.startsAt);
  const day =
    formatInTimeZone(start, event.timeZone, 'yyyy-MM-dd') === formatInTimeZone(new Date(), event.timeZone, 'yyyy-MM-dd')
      ? 'Today'
      : formatInTimeZone(start, event.timeZone, 'EEE d MMM');
  const when = `${day}, ${formatInTimeZone(start, event.timeZone, 'HH:mm')}`;
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onOpen(event.id);
      }}
      accessibilityRole="button"
      accessibilityLabel={`Next up: ${event.title}, ${when}`}
    >
      <ColumnRow label="Next up" index={index}>
        <View style={styles.nextRow}>
          <View style={styles.flex}>
            <ThemedText type="smallBold" numberOfLines={1}>
              {event.title}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {[when, distance].filter(Boolean).join(' · ')}
            </ThemedText>
          </View>
          <Icon name="arrowRight" size={20} color={theme.text} weight="bold" />
        </View>
      </ColumnRow>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    left: PageInset,
    right: PageInset,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listHeader: {
    gap: 12,
  },
  listTitle: {
    marginTop: 18,
  },
  panel: {
    paddingHorizontal: PageInset,
    paddingTop: 14,
    gap: 10,
  },
  rule: {
    height: 3,
  },
  hairline: {
    height: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 8,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  message: {
    paddingVertical: 14,
    gap: 8,
  },
});
