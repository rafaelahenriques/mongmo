import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Spacing } from '@/constants/theme';
import { useProfile, useSetLeaderboardVisible } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { confirmLogOut } from '@/services/auth';
import { useSettingsStore, type NotificationPrefs, type ThemeMode } from '@/state/settingsStore';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const NOTIFICATION_OPTIONS: { key: keyof NotificationPrefs; label: string; hint: string }[] = [
  { key: 'nearby', label: 'Nearby pop-ups', hint: 'Alerts when you’re near a pop-up (500 m)' },
  { key: 'orderUpdates', label: 'Order updates', hint: 'Confirmed, preparing, ready for pickup' },
  { key: 'rewardExpiring', label: 'Reward expiring', hint: 'A reminder before a redeemed reward expires' },
];

function NotificationToggleRow({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.rowTexts}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={label}
        trackColor={{ true: theme.primary, false: theme.backgroundSelected }}
        thumbColor={theme.backgroundElement}
      />
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

  return (
    <View style={[styles.panel, { borderColor: theme.border }]}>
      {NOTIFICATION_OPTIONS.map((option) => (
        <NotificationToggleRow
          key={option.key}
          label={option.label}
          hint={option.hint}
          value={notifications[option.key]}
          onValueChange={(value) => setNotificationPref(option.key, value)}
        />
      ))}

      <View style={styles.row}>
        <View style={styles.rowTexts}>
          <ThemedText type="smallBold">Show me on the leaderboard</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Off keeps your score private
          </ThemedText>
        </View>
        <Switch
          value={leaderboardVisible}
          onValueChange={(value) => setLeaderboardVisible.mutate(value)}
          accessibilityLabel="Show me on the leaderboard"
          trackColor={{ true: theme.success, false: theme.backgroundSelected }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.row}>
        <View style={styles.rowTexts}>
          <ThemedText type="smallBold">Appearance</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Follow the system or lock a theme
          </ThemedText>
        </View>
        <View
          style={[styles.segment, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
          accessibilityRole="tablist"
          accessibilityLabel="Appearance"
        >
          {THEME_OPTIONS.map((option) => {
            const selected = option.value === themeMode;
            return (
              <Pressable
                key={option.value}
                onPress={() => setThemeMode(option.value)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={`${option.label} appearance`}
                style={[
                  styles.segmentItem,
                  selected && { backgroundColor: theme.highlight },
                ]}
              >
                <ThemedText
                  type="label"
                  themeColor={selected ? undefined : 'textSecondary'}
                  style={selected ? { color: theme.onHighlight } : undefined}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button label="Log out" variant="secondary" onPress={confirmLogOut} style={styles.logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
    paddingTop: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rowTexts: {
    flex: 1,
    gap: 2,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 2,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  segmentItem: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 999,
    minWidth: 56,
    alignItems: 'center',
  },
  logout: {
    marginTop: Spacing.one,
  },
});
