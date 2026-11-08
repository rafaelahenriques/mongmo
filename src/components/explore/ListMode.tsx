import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { PopUpPoster, PopupRow } from '@/components/explore/PopupRow';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { glass, onPhoto, onPhotoSoft, PhotoPill, PhotoShade } from '@/components/ui/PhotoShade';
import { usePullToRefresh } from '@/components/ui/Screen';
import { BrandPhotos } from '@/constants/brandPhotos';
import { PageInset, Paper, Radius } from '@/constants/theme';
import { openDirections } from '@/services/directions';
import { haptics } from '@/services/haptics';
import { nameFromContent } from '@/utils/a11y';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { getEventPhase, getStoreStatus, isToday } from '@/utils/dateTime';
import type { EventFilter, PopUpEvent, Store } from '@/types';

const EMPTY_FILTER_COPY: Record<EventFilter, string> = {
  today: 'No pop-ups today.',
  week: 'No pop-ups this week.',
  all: 'No upcoming pop-ups.',
};

export type ListModeProps = {
  /** The title, filter words and view switch, scrolled with the list. */
  header: ReactNode;
  store: Store | null;
  events: PopUpEvent[];
  filter: EventFilter;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelectStore: () => void;
  onSelectEvent: (eventId: string) => void;
  onCheckIn: (eventId: string) => void;
};

/**
 * P-02 Map List: what's on now as photo posters (check in, directions),
 * the rest of today and later as a programme, the café at the end.
 */
export default function ListMode({
  header,
  store,
  events,
  filter,
  isLoading,
  isError,
  onRetry,
  onSelectStore,
  onSelectEvent,
  onCheckIn,
}: ListModeProps) {
  const theme = useTheme();
  const tabBarInset = useTabBarInset();
  const refresh = usePullToRefresh();

  const live = events.filter((event) => getEventPhase(event.startsAt, event.endsAt) === 'live');
  const soon = events.filter((event) => !live.includes(event) && isToday(new Date(event.startsAt), event.timeZone));
  const later = events.filter((event) => !live.includes(event) && !soon.includes(event));
  const storeStatus = store ? getStoreStatus(store.hours, store.timeZone) : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 32 }]}
      refreshControl={<RefreshControl refreshing={refresh.refreshing} onRefresh={refresh.onRefresh} />}
    >
      {header}

      {isLoading ? <ActivityIndicator accessibilityLabel="Loading" color={theme.text} style={styles.loader} /> : null}
      {isError ? (
        <View style={styles.group} accessibilityRole="alert">
          <ThemedText type="caption" themeColor="textSecondary">
            Couldn’t load the pop-ups.
          </ThemedText>
          <Button label="Try again" variant="ghost" size="medium" onPress={onRetry} />
        </View>
      ) : null}
      {!isLoading && !isError && events.length === 0 ? (
        <ThemedText type="caption" themeColor="textSecondary">
          {EMPTY_FILTER_COPY[filter]} The café is open as usual.
        </ThemedText>
      ) : null}

      {live.map((event) => (
        <PopUpPoster
          key={event.id}
          event={event}
          onOpen={() => onSelectEvent(event.id)}
          actions={
            <>
              <PhotoPill label="Check in" tone="brand" onPress={() => onCheckIn(event.id)} />
              <PhotoPill
                label="Directions"
                icon="directions"
                onPress={() => openDirections(event.coordinates, `${event.title}, ${event.venue}`)}
              />
            </>
          }
        />
      ))}

      {soon.length ? (
        <View>
          <ThemedText type="subtitle" accessibilityRole="header" style={styles.heading}>
            Later today
          </ThemedText>
          {soon.map((event, index) => (
            <PopupRow
              key={event.id}
              event={event}
              last={index === soon.length - 1}
              onPress={() => onSelectEvent(event.id)}
            />
          ))}
        </View>
      ) : null}

      {later.length ? (
        <View>
          <ThemedText type="subtitle" accessibilityRole="header" style={styles.heading}>
            {filter === 'week' ? 'Later this week' : 'Coming up'}
          </ThemedText>
          {later.map((event, index) => (
            <PopupRow
              key={event.id}
              event={event}
              last={index === later.length - 1}
              onPress={() => onSelectEvent(event.id)}
            />
          ))}
        </View>
      ) : null}

      {store && storeStatus ? (
        <View style={styles.group}>
          <ThemedText type="subtitle" accessibilityRole="header">
            The café
          </ThemedText>
          <Pressable
            onPress={() => {
              haptics.tap();
              onSelectStore();
            }}
            accessibilityRole="button"
            {...nameFromContent(`${store.name}, ${storeStatus.label}, ${store.address}. Hours and directions.`)}
            style={({ pressed }) => [styles.cafe, { backgroundColor: theme.surfaceDark, opacity: pressed ? 0.9 : 1 }]}
          >
            <Image
              accessible={false}
              accessibilityLabel=""
              source={BrandPhotos.welcome}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <PhotoShade from={0.05} to={0.82} />
            <View style={styles.cafeRow}>
              <View style={styles.cafeTexts}>
                <ThemedText type="label" style={onPhotoSoft}>
                  {storeStatus.label}
                </ThemedText>
                <ThemedText type="title" style={onPhoto}>
                  {store.name}
                </ThemedText>
                <ThemedText type="small" style={onPhotoSoft}>
                  {store.address}
                </ThemedText>
              </View>
              <View style={[styles.cafeGo, glass]}>
                <Icon name="arrowRight" size={18} color={Paper} weight="bold" />
              </View>
            </View>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PageInset,
    gap: 24,
  },
  heading: {
    marginBottom: 4,
  },
  group: {
    gap: 8,
  },
  loader: {
    marginVertical: 24,
  },
  cafe: {
    minHeight: 180,
    borderRadius: Radius.tile,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  cafeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    padding: 20,
  },
  cafeTexts: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  cafeGo: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
