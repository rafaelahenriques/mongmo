import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { BrandPhotos } from '@/constants/brandPhotos';
import { PageInset, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import { ensureNotificationPermission } from '@/services/notifications';
import { useLocationStore } from '@/state/locationStore';
import { useSettingsStore } from '@/state/settingsStore';

/**
 * W-05 Permissions, once after the first sign-in: why location and
 * notifications matter for pop-ups that move around and don't stay long.
 * Continue asks the system for whichever switches are on.
 */
export function PermissionsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const markAsked = useSettingsStore((state) => state.markPermissionsAsked);
  const setPref = useSettingsStore((state) => state.setNotificationPref);
  const [location, setLocation] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [pending, setPending] = useState(false);

  const onContinue = async () => {
    setPending(true);
    try {
      if (location) {
        const { status } = await Location.requestForegroundPermissionsAsync().catch(() => ({ status: 'denied' }));
        useLocationStore.getState().setPermission(status === 'granted' ? 'granted' : 'denied');
      }
      const notify = notifications ? await ensureNotificationPermission().catch(() => false) : false;
      setPref('nearby', location && notify);
      setPref('orderUpdates', notify);
      setPref('achievements', notify);
      setPref('rewardExpiring', notify);
      haptics.success();
    } finally {
      setPending(false);
      markAsked();
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
    >
      {BrandPhotos.permissions ? (
        <Image source={BrandPhotos.permissions} style={styles.photo} contentFit="cover" accessibilityIgnoresInvertColors />
      ) : null}
      <View style={styles.texts}>
        <ThemedText type="title" accessibilityRole="header">
          Know when we pop up nearby
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary">
          Our pop-ups move around and do not stay long. These two switches make sure you catch them.
        </ThemedText>
      </View>

      <View style={styles.switches}>
        <SwitchCard
          title="Location"
          subtitle="Alerts within 500 m of a live pop-up. Check-in needs it too."
          value={location}
          onChange={setLocation}
        />
        <SwitchCard
          title="Notifications"
          subtitle="Order ready, new pop-ups and rewards."
          value={notifications}
          onChange={setNotifications}
        />
      </View>

      <View style={styles.actions}>
        <Button label="Continue" variant="brand" onPress={onContinue} loading={pending} haptic="press" />
        <Pressable onPress={markAsked} accessibilityRole="button" hitSlop={10} style={styles.notNow}>
          <ThemedText type="smallBold">Not now</ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

/** One permission: a bordered card with the reason and a switch. */
function SwitchCard({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.cardTexts}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {subtitle}
        </ThemedText>
      </View>
      <Toggle value={value} onValueChange={onChange} accessibilityLabel={title} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PageInset + 4,
    gap: 20,
  },
  photo: {
    width: '100%',
    aspectRatio: 340 / 306,
    borderRadius: Radius.medium,
  },
  texts: {
    gap: 12,
  },
  switches: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  cardTexts: {
    flex: 1,
    gap: 2,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  notNow: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
});
