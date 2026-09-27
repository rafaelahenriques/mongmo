import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import FilterBar from '@/components/map/FilterBar';
import OfflineBanner from '@/components/map/OfflineBanner';
import StoreSheet from '@/components/map/StoreSheet';
import ListMode from '@/components/explore/ListMode';
import MapMode from '@/components/explore/MapMode';
import ModeToggle, { type ExploreMode } from '@/components/explore/ModeToggle';
import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useEvents } from '@/hooks/useEvents';
import { useStore } from '@/hooks/useStore';
import { useTheme } from '@/hooks/useTheme';
import { useUiTour } from '@/hooks/useUiTour';
import { useFilterStore } from '@/state/filterStore';

/**
 * Explore tab: Map | List toggle over the same upcoming pop-ups, per
 * AGENTS.md ("both show the same upcoming pop-ups... the accessible,
 * non-map alternative"). The store is always visible in both views.
 *
 * The controls row (toggle + filter) floats over the map in Map mode but
 * becomes a normal in-flow header in List mode — so its JSX has to move
 * relative to the list rather than just switch `position`.
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

  const store = storeQuery.data ?? null;
  const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);

  const onSelectStore = useCallback(() => setSheetVisible(true), []);
  const onCloseSheet = useCallback(() => setSheetVisible(false), []);
  const onSelectEvent = useCallback(
    (eventId: string) => {
      router.push({ pathname: '/(explore)/event/[id]', params: { id: eventId } });
    },
    [router],
  );

  // No-op unless EXPO_PUBLIC_UI_TOUR=1 (headless screenshot walkthrough).
  useUiTour({ events, openSheet: onSelectStore, closeSheet: onCloseSheet, setFilter, setMode });

  const storeLoading = storeQuery.isPending && !store;
  const storeLoadError = storeQuery.isError && !store;
  const eventsEmpty = eventsQuery.data !== undefined && events.length === 0;
  const eventsError = eventsQuery.isError;

  const controls = (
    <>
      <OfflineBanner />
      <View style={styles.controlsRow}>
        <ModeToggle value={mode} onChange={setMode} />
        <FilterBar value={filter} onChange={setFilter} />
      </View>
      {eventsError && mode === 'map' ? (
        <View
          style={[
            styles.errorStrip,
            { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
          ]}
          accessibilityRole="alert"
        >
          <ThemedText type="small" themeColor="textSecondary" style={styles.stripText}>
            Couldn&apos;t load events.
          </ThemedText>
          <Pressable
            onPress={() => eventsQuery.refetch()}
            accessibilityRole="button"
            accessibilityLabel="Retry loading events"
            hitSlop={8}
          >
            <ThemedText type="smallBold" style={{ color: theme.danger }}>
              Retry
            </ThemedText>
          </Pressable>
        </View>
      ) : null}
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {mode === 'list' ? <View style={styles.staticHeader}>{controls}</View> : null}

      <View style={styles.flexArea}>
        {mode === 'map' ? (
          <MapMode
            store={store}
            storeLoading={storeLoading}
            storeLoadError={storeLoadError}
            onRetryStore={() => storeQuery.refetch()}
            events={events}
            filter={filter}
            eventsEmpty={eventsEmpty}
            eventsError={eventsError}
            onSelectStore={onSelectStore}
            onSelectEvent={onSelectEvent}
          />
        ) : (
          <ListMode
            store={store}
            events={events}
            filter={filter}
            isLoading={eventsQuery.isPending}
            isError={eventsError}
            onRetry={() => eventsQuery.refetch()}
            onSelectStore={onSelectStore}
            onSelectEvent={onSelectEvent}
          />
        )}
      </View>

      {mode === 'map' ? (
        <View style={styles.overlayTop} pointerEvents="box-none">
          {controls}
        </View>
      ) : null}

      <StoreSheet visible={sheetVisible} store={store} onClose={onCloseSheet} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexArea: {
    flex: 1,
  },
  staticHeader: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  overlayTop: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.three,
    right: Spacing.three,
    gap: Spacing.two,
  },
  controlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  errorStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  stripText: {
    flexShrink: 1,
  },
});
