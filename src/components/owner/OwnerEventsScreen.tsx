import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, SectionList, StyleSheet, View } from 'react-native';

import type { OwnerEventSummary } from '@/api/owner';
import {
  OWNER_GROUP_LABEL,
  OWNER_GROUP_TONE,
  ownerEventGroup,
  type OwnerEventGroup,
} from '@/components/owner/ownerEventPhase';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { Spacing } from '@/constants/theme';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useOwnerEvents } from '@/hooks/useOwnerEvents';
import { useTheme } from '@/hooks/useTheme';
import { formatEventWindow } from '@/utils/dateTime';

const GROUP_ORDER: OwnerEventGroup[] = ['live', 'upcoming', 'past', 'cancelled'];

/** Owner: every pop-up, grouped Live now / Upcoming / Past / Cancelled. */
export default function OwnerEventsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const eventsQuery = useOwnerEvents();

  const sections = useMemo(() => {
    const now = new Date();
    const events = eventsQuery.data ?? [];
    return GROUP_ORDER.map((group) => ({
      group,
      title: OWNER_GROUP_LABEL[group],
      data: events
        .filter((event) => ownerEventGroup(event, now) === group)
        // Soonest first for what's ahead; most recent first for what's done.
        .sort((a, b) =>
          group === 'live' || group === 'upcoming'
            ? a.startsAt.localeCompare(b.startsAt)
            : b.startsAt.localeCompare(a.startsAt),
        ),
    })).filter((section) => section.data.length > 0);
  }, [eventsQuery.data]);

  const openEvent = useCallback(
    (id: string) => router.push({ pathname: '/(profile)/owner/event/[id]', params: { id } }),
    [router],
  );
  const openNew = useCallback(() => router.push('/(profile)/owner/event/new'), [router]);

  if (eventsQuery.isPending) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  return (
    <SectionList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + Spacing.five }]}
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <Button
          label="Create new pop-up"
          accessibilityLabel="Create a new pop-up event"
          variant="brand"
          icon="add"
          onPress={openNew}
        />
      }
      ListEmptyComponent={
        <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
          No pop-ups yet — create your first one above.
        </ThemedText>
      }
      renderSectionHeader={({ section }) => (
        <ThemedText type="section" style={styles.sectionTitle} accessibilityRole="header">
          {section.title} · {section.data.length}
        </ThemedText>
      )}
      renderItem={({ item, section }) => (
        <OwnerEventRow event={item} group={section.group} onPress={() => openEvent(item.id)} />
      )}
    />
  );
}

function OwnerEventRow({
  event,
  group,
  onPress,
}: {
  event: OwnerEventSummary;
  group: OwnerEventGroup;
  onPress: () => void;
}) {
  const theme = useTheme();
  const muted = group === 'past' || group === 'cancelled';
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${event.title}, ${OWNER_GROUP_LABEL[group]}`}
      style={[styles.row, muted && styles.muted]}
    >
      <View style={styles.rowTexts}>
        <Chip label={OWNER_GROUP_LABEL[group]} tone={OWNER_GROUP_TONE[group]} />
        <ThemedText type="section" numberOfLines={1}>
          {event.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {formatEventWindow(event.startsAt, event.endsAt, event.timeZone)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {event.venue}, {event.city}
        </ThemedText>
      </View>
      <Icon name="chevronRight" size={18} color={theme.textSecondary} />
    </Card>
  );
}

const styles = StyleSheet.create({
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.three + Spacing.one,
    gap: Spacing.two,
  },
  sectionTitle: {
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.two + Spacing.one,
  },
  muted: {
    opacity: 0.7,
  },
  rowTexts: {
    flex: 1,
    gap: Spacing.one,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
});
