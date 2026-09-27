import { Alert, ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye } from 'lucide-react-native';

import OwnerChallengesManager from '@/components/owner/OwnerChallengesManager';
import OwnerEventForm from '@/components/owner/OwnerEventForm';
import OwnerEventQr from '@/components/owner/OwnerEventQr';
import OwnerMenuAttach from '@/components/owner/OwnerMenuAttach';
import { OWNER_GROUP_LABEL, OWNER_GROUP_TONE, ownerEventGroup } from '@/components/owner/ownerEventPhase';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { Spacing } from '@/constants/theme';
import { useOwnerEvent, useSetEventStatus, useUpdateEvent } from '@/hooks/useOwnerEvent';
import { useTheme } from '@/hooks/useTheme';
import { formatEventWindow } from '@/utils/dateTime';

export type OwnerEventDetailScreenProps = {
  eventId: string;
};

/**
 * Owner: manage one pop-up, in the order it's needed on the day — the QR to
 * put up, challenges and menu, then editing the details, then wrapping up.
 */
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
        <ThemedText type="section">Pop-up not found</ThemedText>
      </View>
    );
  }

  const event = eventQuery.data;
  const group = ownerEventGroup({
    id: event.id,
    title: event.title,
    type: event.type,
    city: event.city,
    venue: event.venue,
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    timeZone: event.time_zone,
    status: event.status,
    capacity: event.capacity,
  });
  const finished = event.status === 'ended' || event.status === 'cancelled';

  const onEndEvent = () => {
    Alert.alert('End this pop-up?', 'It will stop appearing as live.', [
      { text: 'Back', style: 'cancel' },
      { text: 'End pop-up', onPress: () => setStatus.mutate('ended') },
    ]);
  };

  const onCancelEvent = () => {
    Alert.alert('Cancel this pop-up?', 'It will be removed from Explore.', [
      { text: 'Back', style: 'cancel' },
      { text: 'Cancel pop-up', style: 'destructive', onPress: () => setStatus.mutate('cancelled') },
    ]);
  };

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Card>
        <Chip label={OWNER_GROUP_LABEL[group]} tone={OWNER_GROUP_TONE[group]} style={styles.chip} />
        <ThemedText type="title" style={styles.title} accessibilityRole="header">
          {event.title}
        </ThemedText>
        <ThemedText type="smallBold" themeColor="primaryText">
          {formatEventWindow(event.starts_at, event.ends_at, event.time_zone)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {event.venue}, {event.city}
        </ThemedText>
        <Button
          label="Preview as customer"
          variant="secondary"
          icon={<Eye size={20} color={theme.text} />}
          onPress={() => router.push({ pathname: '/(explore)/event/[id]', params: { id: eventId } })}
          style={styles.preview}
        />
      </Card>

      <ThemedText type="section" style={styles.sectionTitle}>
        Check-in QR code
      </ThemedText>
      <OwnerEventQr eventId={eventId} />

      <ThemedText type="section" style={styles.sectionTitle}>
        Challenges
      </ThemedText>
      <OwnerChallengesManager eventId={eventId} />

      <ThemedText type="section" style={styles.sectionTitle}>
        Menu
      </ThemedText>
      <OwnerMenuAttach eventId={eventId} />

      <ThemedText type="section" style={styles.sectionTitle}>
        Edit details
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
        submitError={updateEvent.error?.message}
        onSubmit={(input) => updateEvent.mutate(input)}
      />

      <ThemedText type="section" style={styles.sectionTitle}>
        Wrap up
      </ThemedText>
      <View style={styles.wrapUp}>
        <Button
          label="End pop-up"
          accessibilityLabel="End this event"
          variant="secondary"
          onPress={onEndEvent}
          disabled={finished}
          style={styles.flex}
        />
        <Button
          label="Cancel pop-up"
          accessibilityLabel="Cancel this event"
          variant="danger"
          onPress={onCancelEvent}
          disabled={event.status === 'cancelled'}
          style={styles.flex}
        />
      </View>
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
  chip: {
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 34,
    lineHeight: 36,
  },
  preview: {
    marginTop: Spacing.two,
  },
  sectionTitle: {
    marginTop: Spacing.four,
  },
  wrapUp: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
