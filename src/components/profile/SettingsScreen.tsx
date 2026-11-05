import { useCallback, useState, type ReactNode } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { ListRow } from '@/components/ui/ListRow';
import { Segmented } from '@/components/ui/Segmented';
import { Toggle } from '@/components/ui/Toggle';
import { PageInset } from '@/constants/theme';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useProfile, useSetLeaderboardVisible } from '@/hooks/useProfile';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { crashReportingAvailable } from '@/lib/crashReporting';
import { env } from '@/lib/env';
import { confirmDeleteAccount, confirmLogOut } from '@/services/auth';
import {
  ensureNotificationPermission,
  getNotificationPermission,
  sendTestNotification,
  type NotificationPermission,
} from '@/services/notifications';
import { useSettingsStore, type NotificationPrefs, type ThemeMode } from '@/state/settingsStore';

const HELP_EMAIL = 'hello@mongmo-store.com';

/** "Version 1.2.0", plus the environment on test builds: what a bug report asks for. */
const VERSION_LABEL = [
  `Version ${Constants.expoConfig?.version ?? '?'}`,
  env.appEnv === 'production' ? null : env.appEnv,
]
  .filter(Boolean)
  .join(' · ');

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const NOTIFICATION_OPTIONS: { key: keyof NotificationPrefs; label: string; hint: string }[] = [
  { key: 'nearby', label: 'Pop-ups near me', hint: 'Within 500 m of a live pop-up' },
  { key: 'orderUpdates', label: 'Order updates', hint: 'When your order is ready' },
  { key: 'achievements', label: 'Badges', hint: 'The moment you unlock one' },
  { key: 'rewardExpiring', label: 'Rewards', hint: 'Before a reward you redeemed runs out' },
  { key: 'cartReminder', label: 'Cart reminders', hint: 'If you leave something in your cart' },
];

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <ThemedText type="section" accessibilityRole="header">
        {title}
      </ThemedText>
      <View>{children}</View>
    </View>
  );
}

/**
 * M-04 Settings: the alerts you get, the app (appearance, the leaderboard,
 * location), and your account — your email, change password, help, log
 * out, delete. Edit profile is on Account.
 */
export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const notifications = useSettingsStore((state) => state.notifications);
  const themeMode = useSettingsStore((state) => state.themeMode);
  const setNotificationPref = useSettingsStore((state) => state.setNotificationPref);
  const setThemeMode = useSettingsStore((state) => state.setThemeMode);
  const crashReports = useSettingsStore((state) => state.crashReports);
  const setCrashReports = useSettingsStore((state) => state.setCrashReports);
  const profile = useProfile();
  const setLeaderboardVisible = useSetLeaderboardVisible();
  const account = useAuthUser();
  const email = account.data?.email;

  // Re-read on every visit: they may have just flipped it in the phone's settings.
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 32 }]}
    >
      <Group title="Notifications">
        {Platform.OS !== 'web' && permission && !permission.granted ? (
          <View style={[styles.notice, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="caption">
              {permission.canAskAgain
                ? 'Notifications are off. Allow them to hear about pop-ups near you and your orders.'
                : 'Notifications are off for Mongmo. Switch them on in your phone’s settings.'}
            </ThemedText>
            <Button
              label={permission.canAskAgain ? 'Allow notifications' : 'Open settings'}
              variant="primary"
              size="small"
              onPress={onFixPermission}
            />
          </View>
        ) : null}
        {NOTIFICATION_OPTIONS.map((option, index) => (
          <ListRow
            key={option.key}
            title={option.label}
            subtitle={option.hint}
            last={index === NOTIFICATION_OPTIONS.length - 1 && Platform.OS === 'web'}
            trailing={
              <Toggle
                value={notifications[option.key]}
                onValueChange={(value) => setNotificationPref(option.key, value)}
                accessibilityLabel={option.label}
              />
            }
          />
        ))}
        {Platform.OS !== 'web' ? (
          <ListRow
            title="Send a test notification"
            subtitle={testResult ?? 'Check they reach this phone'}
            onPress={async () => {
              const sent = await sendTestNotification();
              setTestResult(sent ? 'Sent. It should show up now.' : 'Notifications are off for Mongmo.');
              refreshPermission();
            }}
            chevron={false}
            last
          />
        ) : null}
      </Group>

      <Group title="App">
        <ListRow
          title="Appearance"
          trailing={
            <Segmented
              options={THEME_OPTIONS}
              value={themeMode}
              onChange={setThemeMode}
              accessibilityLabel="Appearance"
              look="switch"
            />
          }
        />
        <ListRow
          title="Show me on the leaderboard"
          subtitle="Off keeps your points private"
          trailing={
            <Toggle
              value={profile.data?.leaderboardVisible ?? true}
              onValueChange={(value) => setLeaderboardVisible.mutate(value)}
              accessibilityLabel="Show me on the leaderboard"
            />
          }
        />
        {Platform.OS !== 'web' ? (
          <ListRow title="Location" value="Phone settings" onPress={() => void Linking.openSettings()} last />
        ) : null}
      </Group>

      <Group title="Privacy">
        <ListRow
          title="Your data"
          subtitle="See it, download it, delete it"
          onPress={() => router.push('/(profile)/your-data')}
        />
        {crashReportingAvailable ? (
          <ListRow
            title="Crash reports"
            subtitle="Send a report when the app crashes. Nothing personal."
            trailing={
              <Toggle
                value={crashReports === 'on'}
                onValueChange={(on) => setCrashReports(on ? 'on' : 'off')}
                accessibilityLabel="Crash reports"
              />
            }
          />
        ) : null}
        <ListRow title="Privacy policy" onPress={() => router.push('/(profile)/privacy')} last />
      </Group>

      <Group title="Account">
        <ListRow
          title="Email"
          subtitle={email ?? (account.data?.isGuest ? 'None yet: you’re a guest' : ' ')}
          chevron={false}
        />
        {email ? <ListRow title="Change password" onPress={() => router.push('/(profile)/password')} /> : null}
        <ListRow title="Help" value={HELP_EMAIL} onPress={() => void Linking.openURL(`mailto:${HELP_EMAIL}`)} />
        <ListRow title="Log out" onPress={confirmLogOut} chevron={false} />
        <ListRow title="Delete account" onPress={() => void confirmDeleteAccount()} chevron={false} danger last />
      </Group>

      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        {VERSION_LABEL}
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PageInset,
    paddingTop: 4,
    gap: 24,
  },
  group: {
    gap: 2,
  },
  notice: {
    padding: 12,
    gap: 10,
    marginVertical: 8,
  },
});
