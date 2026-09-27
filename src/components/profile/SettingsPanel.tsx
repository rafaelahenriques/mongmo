import { useCallback, useState, type ReactNode } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { IconName } from '@/components/ui/Icon';
import { ListRow } from '@/components/ui/ListRow';
import { Segmented } from '@/components/ui/Segmented';
import { Toggle } from '@/components/ui/Toggle';
import { Spacing } from '@/constants/theme';
import { useProfile, useSetLeaderboardVisible } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { confirmLogOut } from '@/services/auth';
import {
  ensureNotificationPermission,
  getNotificationPermission,
  sendTestNotification,
  type NotificationPermission,
} from '@/services/notifications';
import { useSettingsStore, type NotificationPrefs, type ThemeMode } from '@/state/settingsStore';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const NOTIFICATION_OPTIONS: { key: keyof NotificationPrefs; label: string; hint: string; icon: IconName }[] = [
  { key: 'nearby', label: 'Nearby pop-ups', hint: 'When you’re within 500 m of one', icon: 'pin' },
  { key: 'orderUpdates', label: 'Order updates', hint: 'Confirmed, preparing, ready', icon: 'bag' },
  { key: 'rewardExpiring', label: 'Reward expiring', hint: 'Before a redeemed reward expires', icon: 'ticket' },
  { key: 'achievements', label: 'Badges', hint: 'The moment you unlock one', icon: 'medal' },
];

function ToggleRow({
  label,
  hint,
  icon,
  value,
  onValueChange,
}: {
  label: string;
  hint: string;
  icon: IconName;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <ListRow
      title={label}
      subtitle={hint}
      icon={icon}
      trailing={<Toggle value={value} onValueChange={onValueChange} accessibilityLabel={label} />}
    />
  );
}

/** A grouped card of rows with hairline dividers (iOS Settings style). */
function Group({ title, children }: { title: string; children: ReactNode[] }) {
  const theme = useTheme();
  const rows = children.filter(Boolean);
  return (
    <View style={styles.group}>
      <ThemedText type="label" themeColor="textSecondary" style={styles.groupTitle}>
        {title}
      </ThemedText>
      <Card style={styles.groupCard}>
        {rows.map((row, index) => (
          <View key={index}>
            {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
            {row}
          </View>
        ))}
      </Card>
    </View>
  );
}

/**
 * Notification, appearance and privacy controls plus log out. Every row is
 * a labelled switch/segment so screen readers announce state, and log out
 * requires an explicit confirmation before clearing the local session.
 */
export default function SettingsPanel() {
  const theme = useTheme();
  const notifications = useSettingsStore((state) => state.notifications);
  const themeMode = useSettingsStore((state) => state.themeMode);
  const setNotificationPref = useSettingsStore((state) => state.setNotificationPref);
  const setThemeMode = useSettingsStore((state) => state.setThemeMode);

  const profile = useProfile();
  const leaderboardVisible = profile.data?.leaderboardVisible ?? true;
  const setLeaderboardVisible = useSetLeaderboardVisible();

  // Re-read on every visit: the user may have just flipped it in iOS Settings.
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const refreshPermission = useCallback(() => {
    getNotificationPermission().then(setPermission);
  }, []);
  useFocusEffect(refreshPermission);

  const onFixPermission = async () => {
    if (permission?.canAskAgain) {
      await ensureNotificationPermission();
      refreshPermission();
    } else {
      await Linking.openSettings();
    }
  };

  const onSendTest = async () => {
    const sent = await sendTestNotification();
    setTestResult(sent ? 'Sent — it should appear right now.' : 'Notifications are off for Mongmo.');
    refreshPermission();
  };

  return (
    <View style={styles.panel}>
      {Platform.OS !== 'web' && permission && !permission.granted ? (
        <Card tone="accent" style={styles.permission}>
          <ThemedText type="section" style={{ color: theme.onAccent }}>
            Notifications are off
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.onAccent }}>
            {permission.canAskAgain
              ? 'Allow them to hear about nearby pop-ups, your orders and new badges.'
              : 'You turned them off for Mongmo — switch them back on in Settings.'}
          </ThemedText>
          <Button
            label={permission.canAskAgain ? 'Allow notifications' : 'Open Settings'}
            icon="bell"
            size="medium"
            onPress={onFixPermission}
          />
        </Card>
      ) : null}

      <Group title="Notifications">
        {[
          ...NOTIFICATION_OPTIONS.map((option) => (
            <ToggleRow
              key={option.key}
              label={option.label}
              hint={option.hint}
              icon={option.icon}
              value={notifications[option.key]}
              onValueChange={(value) => setNotificationPref(option.key, value)}
            />
          )),
          Platform.OS !== 'web' ? (
            <ListRow
              key="test"
              title="Send a test notification"
              subtitle={testResult ?? 'Check they reach this phone'}
              icon="bell"
              onPress={onSendTest}
            />
          ) : null,
        ]}
      </Group>

      <Group title="Privacy">
        {[
          <ToggleRow
            key="leaderboard"
            label="Show me on the leaderboard"
            hint="Off keeps your score private"
            icon="trophy"
            value={leaderboardVisible}
            onValueChange={(value) => setLeaderboardVisible.mutate(value)}
          />,
        ]}
      </Group>

      <View style={styles.group}>
        <ThemedText type="label" themeColor="textSecondary" style={styles.groupTitle}>
          Appearance
        </ThemedText>
        <Segmented
          options={THEME_OPTIONS}
          value={themeMode}
          onChange={setThemeMode}
          accessibilityLabel="Appearance"
          style={styles.segmented}
        />
      </View>

      <Button label="Log out" variant="danger" icon="logout" haptic="press" onPress={confirmLogOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: Spacing.four,
  },
  permission: {
    gap: Spacing.two,
  },
  group: {
    gap: Spacing.two,
  },
  groupTitle: {
    paddingHorizontal: Spacing.one,
  },
  groupCard: {
    paddingVertical: Spacing.one,
    gap: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 40 + Spacing.three,
  },
  segmented: {
    alignSelf: 'stretch',
    justifyContent: 'space-between',
  },
});
