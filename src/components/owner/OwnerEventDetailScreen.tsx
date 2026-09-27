import { Alert, ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import OwnerChallengesManager from '@/components/owner/OwnerChallengesManager';
import OwnerEventForm from '@/components/owner/OwnerEventForm';
import OwnerEventQr from '@/components/owner/OwnerEventQr';
import OwnerMenuAttach from '@/components/owner/OwnerMenuAttach';
import PhotoGallery from '@/components/profile/PhotoGallery';
import { OWNER_GROUP_LABEL, OWNER_GROUP_TONE, ownerEventGroup } from '@/components/owner/ownerEventPhase';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { IconBadge } from '@/components/ui/IconBadge';
import { SectionHeader } from '@/components/ui/Screen';
import { Spacing } from '@/constants/theme';
import { useOwnerEvent, useSetEventStatus, useUpdateEvent } from '@/hooks/useOwnerEvent';
import { useEventPhotos } from '@/hooks/usePhotos';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
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
  const tabBarInset = useTabBarInset();
  const eventQuery = useOwnerEvent(eventId);
  const updateEvent = useUpdateEvent(eventId);
  const setStatus = useSetEventStatus(eventId);
  const photos = useEventPhotos(eventId);

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
        <IconBadge name="alert" size={48} />
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
    haptics.warning();
    Alert.alert('End this pop-up?', 'It will stop appearing as live.', [
      { text: 'Back', style: 'cancel' },
      { text: 'End pop-up', onPress: () => setStatus.mutate('ended') },
    ]);
  };

  const onCancelEvent = () => {
    haptics.warning();
    Alert.alert('Cancel this pop-up?', 'It will be removed from Explore.', [
      { text: 'Back', style: 'cancel' },
      { text: 'Cancel pop-up', style: 'destructive', onPress: () => setStatus.mutate('cancelled') },
    ]);
  };

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + Spacing.five }]}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={styles.hero}>
        <Chip label={OWNER_GROUP_LABEL[group]} tone={OWNER_GROUP_TONE[group]} />
        <ThemedText type="title" accessibilityRole="header">
          {event.title}
        </ThemedText>
        <View style={styles.meta}>
          <Icon name="clock" size={14} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
            {formatEventWindow(event.starts_at, event.ends_at, event.time_zone)}
          </ThemedText>
        </View>
        <View style={styles.meta}>
          <Icon name="pin" size={14} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
            {event.venue}, {event.city}
          </ThemedText>
        </View>
        <Button
          label="Preview as customer"
          variant="ghost"
          size="medium"
          icon="eye"
          onPress={() => router.push({ pathname: '/(explore)/event/[id]', params: { id: eventId } })}
          style={styles.preview}
        />
      </Card>

      <SectionHeader title="Check-in QR code" />
      <OwnerEventQr eventId={eventId} />

      <SectionHeader title="Challenges" />
      <OwnerChallengesManager eventId={eventId} timeZone={event.time_zone} />

      <SectionHeader title="Guest photos" />
      <PhotoGallery photos={photos.data ?? []} emptyText="Photos guests take for this pop-up's challenges land here." />

      <SectionHeader title="Menu" />
      <OwnerMenuAttach eventId={eventId} />

      <SectionHeader title="Edit details" />
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

      <SectionHeader title="Wrap up" />
      <View style={styles.wrapUp}>
        <Button
          label="End pop-up"
          accessibilityLabel="End this event"
          variant="secondary"
          icon="check"
          onPress={onEndEvent}
          disabled={finished}
          style={styles.flex}
        />
        <Button
          label="Cancel pop-up"
          accessibilityLabel="Cancel this event"
          variant="danger"
          icon="close"
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
    padding: Spacing.three + Spacing.one,
    gap: Spacing.three,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  hero: {
    gap: Spacing.two,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  preview: {
    marginTop: Spacing.two,
  },
  wrapUp: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
