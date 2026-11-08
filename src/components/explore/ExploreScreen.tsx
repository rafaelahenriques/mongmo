import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { LayoutAnimation, PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { formatInTimeZone } from 'date-fns-tz';

import FilterBar from '@/components/map/FilterBar';
import OfflineBanner from '@/components/map/OfflineBanner';
import StoreSheet from '@/components/map/StoreSheet';
import ListMode from '@/components/explore/ListMode';
import MapMode from '@/components/explore/MapMode';
import ModeToggle, { type ExploreMode } from '@/components/explore/ModeToggle';
import { ThemedText } from '@/components/ThemedText';
import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { ColumnRow } from '@/components/ui/ColumnRow';
import { Icon } from '@/components/ui/Icon';
import { PageInset } from '@/constants/theme';
import { useEvents } from '@/hooks/useEvents';
import { useStore } from '@/hooks/useStore';
import { useTheme } from '@/hooks/useTheme';
import { openDirections } from '@/services/directions';
import { haptics } from '@/services/haptics';
import { useBusyStore } from '@/state/busyStore';
import { useFilterStore } from '@/state/filterStore';
import { useLocationStore } from '@/state/locationStore';
import { nameFromContent } from '@/utils/a11y';
import { getEventPhase } from '@/utils/dateTime';
import { distanceInMeters, formatDistance } from '@/utils/distance';
import type { PopUpEvent } from '@/types';
import { useMotion } from '@/constants/motion';

/**
 * Pop-ups tab: find one fast. The map with what's on right now underneath
 * (P-01), or the same pop-ups as a list (P-02). The dark switch changes the
 * view; the underlined words filter it.
 */
export default function ExploreScreen() {
  const theme = useTheme();
  const router = useRouter();
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

  // The panel under the map folds away to a one-line strip for a map-only view.
  const [panelOpen, setPanelOpen] = useState(true);
  const { reduce: reduceMotion } = useMotion();
  const showPanel = useCallback(
    (open: boolean) => {
      haptics.select();
      // Folds smoothly, or snaps when the person asked for less motion.
      if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setPanelOpen(open);
    },
    [reduceMotion],
  );
  const swipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, drag) => Math.abs(drag.dy) > 8 && Math.abs(drag.dy) > Math.abs(drag.dx),
        onPanResponderRelease: (_, drag) => {
          if (drag.dy > 24) showPanel(false);
          else if (drag.dy < -24) showPanel(true);
        },
      }),
    [showPanel],
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

  const toggle = (
    <View style={styles.topRow}>
      <ModeToggle value={mode} onChange={setMode} />
    </View>
  );

  if (mode === 'list') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <AppHeader title="Pop-ups" />
        <ListMode
          header={
            <View style={styles.listHeader}>
              {toggle}
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
      <AppHeader title="Pop-ups" />
      <View style={styles.map}>
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
        <View style={styles.overlay} pointerEvents="box-none">
          {toggle}
          <OfflineBanner />
        </View>
      </View>

      <View style={styles.panel}>
        {/* Tap or swipe the handle to fold the panel away and see only the map. */}
        <Pressable
          {...swipe.panHandlers}
          onPress={() => showPanel(!panelOpen)}
          accessibilityRole="button"
          accessibilityLabel={panelOpen ? 'Hide the list and show only the map' : 'Show the list'}
          hitSlop={{ top: 8, bottom: 4 }}
          style={styles.handle}
        >
          <View style={[styles.grabber, { backgroundColor: theme.border }]} />
        </Pressable>
        {panelOpen ? null : (
          <Pressable
            onPress={() => showPanel(true)}
            accessibilityRole="button"
            accessibilityLabel="Show the list"
            style={styles.peek}
          >
            <ThemedText type="smallBold" numberOfLines={1} style={styles.flex}>
              {live ? `Right now: ${live.title}` : next ? `Next up: ${next.title}` : 'Pop-ups'}
            </ThemedText>
            <Icon name="chevronUp" size={18} color={theme.text} weight="semibold" />
          </Pressable>
        )}
        {panelOpen ? (
          // Scrolls when large text makes it taller than its share of the screen.
          <ScrollView style={styles.panelScroll} contentContainerStyle={styles.panelContent}>
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
              <LiveNow event={live} onOpen={onSelectEvent} onCheckIn={onCheckIn} />
            ) : !eventsQuery.isPending && !next ? (
              <ThemedText type="caption" themeColor="textSecondary" style={styles.message}>
                No pop-ups {filter === 'today' ? 'today' : filter === 'week' ? 'this week' : 'planned'}. The café is
                open as usual.
              </ThemedText>
            ) : null}
            {next ? (
              <>
                {live ? <View style={[styles.hairline, { backgroundColor: theme.border }]} /> : null}
                <NextUp event={next} onOpen={onSelectEvent} />
              </>
            ) : null}
          </ScrollView>
        ) : null}
      </View>

      <StoreSheet visible={sheetVisible} store={store} onClose={onCloseSheet} />
    </View>
  );
}

/** "Right now": the nearest live pop-up, with check in and directions. */
function LiveNow({
  event,
  onOpen,
  onCheckIn,
}: {
  event: PopUpEvent;
  onOpen: (id: string) => void;
  onCheckIn: (id: string) => void;
}) {
  const coordinates = useLocationStore((state) => state.coordinates);
  const busy = useBusyStore((state) => state.busy[event.id] ?? event.busy);
  const distance = coordinates ? formatDistance(distanceInMeters(coordinates, event.coordinates)) : null;
  const hours = `${formatInTimeZone(new Date(event.startsAt), event.timeZone, 'HH:mm')} – ${formatInTimeZone(new Date(event.endsAt), event.timeZone, 'HH:mm')}`;
  return (
    <ColumnRow label="Right now">
      <Pressable
        onPress={() => onOpen(event.id)}
        accessibilityRole="button"
        {...nameFromContent(`${event.title}. Open.`)}
      >
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

/** "Next up": the next pop-up to start, one line and an arrow. */
function NextUp({ event, onOpen }: { event: PopUpEvent; onOpen: (id: string) => void }) {
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
      {...nameFromContent(`Next up: ${event.title}, ${when}`)}
    >
      <ColumnRow label="Next up">
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
    top: 12,
    left: PageInset,
    right: PageInset,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  listHeader: {
    gap: 12,
    paddingTop: 12,
  },
  listTitle: {
    marginTop: 18,
  },
  map: {
    flex: 1,
    minHeight: 180,
  },
  panel: {
    paddingHorizontal: PageInset,
    gap: 10,
    maxHeight: '60%',
  },
  panelScroll: {
    flexGrow: 0,
  },
  panelContent: {
    gap: 10,
  },
  handle: {
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  peek: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
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
