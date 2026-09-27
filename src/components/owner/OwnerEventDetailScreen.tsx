import { Alert, ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import OwnerChallengesManager from '@/components/owner/OwnerChallengesManager';
import OwnerEventForm from '@/components/owner/OwnerEventForm';
import OwnerEventQr from '@/components/owner/OwnerEventQr';
import OwnerMenuAttach from '@/components/owner/OwnerMenuAttach';
import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useOwnerEvent, useSetEventStatus, useUpdateEvent } from '@/hooks/useOwnerEvent';
import { useTheme } from '@/hooks/useTheme';

export type OwnerEventDetailScreenProps = {
  eventId: string;
};

/** Owner: edit an event, manage its challenges and menu, show its QR, end/cancel it. */
export default function OwnerEventDetailScreen({ eventId }: OwnerEventDetailScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const eventQuery = useOwnerEvent(eventId);
  const updateEvent = useUpdateEvent(eventId);
  const setStatus = useSetEventStatus(eventId);

  if (eventQuery.isPending) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  if (!eventQuery.data) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ThemedText type="smallBold">Event not found</ThemedText>
      </View>
    );
  }

  const event = eventQuery.data;

  const onEndEvent = () => {
    Alert.alert('End this event?', 'It will stop appearing as live.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End event', onPress: () => setStatus.mutate('ended') },
    ]);
  };

  const onCancelEvent = () => {
    Alert.alert('Cancel this event?', 'It will be removed from Explore.', [
      { text: 'Back', style: 'cancel' },
      { text: 'Cancel event', style: 'destructive', onPress: () => setStatus.mutate('cancelled') },
    ]);
  };

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Event details
      </ThemedText>
      <OwnerEventForm
        initial={{
          title: event.title,
          type: event.type,
          city: event.city,
          venue: event.venue,
          latitude: event.latitude,
          longitude: event.longitude,
          startsAt: event.starts_at,
          endsAt: event.ends_at,
          timeZone: event.time_zone,
          description: event.description,
          imageUrl: event.image_url ?? '',
          capacity: event.capacity,
        }}
        submitLabel="Save changes"
        pending={updateEvent.isPending}
        onSubmit={(input) => updateEvent.mutate(input)}
      />

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Check-in QR code
      </ThemedText>
      <OwnerEventQr eventId={eventId} />

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Menu
      </ThemedText>
      <OwnerMenuAttach eventId={eventId} />

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Challenges
      </ThemedText>
      <OwnerChallengesManager eventId={eventId} />

      <View style={styles.dangerZone}>
        <Pressable
          onPress={onEndEvent}
          disabled={event.status !== 'live' && event.status !== 'scheduled'}
          accessibilityRole="button"
          accessibilityLabel="End this event"
          style={[styles.dangerButton, { backgroundColor: theme.backgroundSelected, opacity: event.status === 'ended' || event.status === 'cancelled' ? 0.5 : 1 }]}
        >
          <ThemedText type="smallBold">End event</ThemedText>
        </Pressable>
        <Pressable
          onPress={onCancelEvent}
          disabled={event.status === 'cancelled'}
          accessibilityRole="button"
          accessibilityLabel="Cancel this event"
          style={[styles.dangerButton, { backgroundColor: theme.danger, opacity: event.status === 'cancelled' ? 0.5 : 1 }]}
        >
          <ThemedText type="smallBold" style={styles.dangerText}>
            Cancel event
          </ThemedText>
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push({ pathname: '/(explore)/event/[id]', params: { id: eventId } })}
        accessibilityRole="button"
        accessibilityLabel="Preview as customer"
        style={[styles.previewButton, { borderColor: theme.backgroundSelected }]}
      >
        <ThemedText type="smallBold">Preview as customer</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    marginTop: Spacing.four,
  },
  dangerZone: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  dangerButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerText: {
    color: '#FFFFFF',
  },
  previewButton: {
    marginTop: Spacing.three,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
