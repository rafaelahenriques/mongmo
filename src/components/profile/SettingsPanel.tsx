import { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore, type ThemeMode } from '@/state/settingsStore';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/**
 * Notification, appearance and privacy controls plus log out. Every row is
 * a labelled switch/segment so screen readers announce state, and log out
 * requires an explicit confirmation before clearing the local session.
 */
export default function SettingsPanel() {
  const theme = useTheme();
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);
  const themeMode = useSettingsStore((state) => state.themeMode);
  const leaderboardVisible = useSettingsStore((state) => state.leaderboardVisible);
  const setNotificationsEnabled = useSettingsStore((state) => state.setNotificationsEnabled);
  const setThemeMode = useSettingsStore((state) => state.setThemeMode);
  const setLeaderboardVisible = useSettingsStore((state) => state.setLeaderboardVisible);
  const logOut = useSettingsStore((state) => state.logOut);

  const onLogOut = useCallback(() => {
    Alert.alert(
      'Log out?',
      'This clears your check-ins, points and badges stored on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: logOut },
      ],
    );
  }, [logOut]);

  return (
    <View style={[styles.panel, { borderColor: theme.backgroundSelected }]}>
      <View style={styles.row}>
        <View style={styles.rowTexts}>
          <ThemedText type="smallBold">Push notifications</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Alerts when you’re near a pop-up (500 m)
          </ThemedText>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          accessibilityLabel="Push notifications"
          trackColor={{ true: theme.success, false: theme.backgroundSelected }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.row}>
        <View style={styles.rowTexts}>
          <ThemedText type="smallBold">Show me on the leaderboard</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Off keeps your score private
          </ThemedText>
        </View>
        <Switch
          value={leaderboardVisible}
          onValueChange={setLeaderboardVisible}
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
          style={[styles.segment, { backgroundColor: theme.backgroundElement }]}
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
                  selected && { backgroundColor: theme.backgroundSelected },
                ]}
              >
                <ThemedText
                  type="small"
                  themeColor={selected ? undefined : 'textSecondary'}
                  style={selected ? styles.segmentSelectedText : undefined}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={onLogOut}
        accessibilityRole="button"
        accessibilityLabel="Log out"
        style={({ pressed }) => [styles.logout, { opacity: pressed ? 0.7 : 1 }]}
      >
        <ThemedText type="smallBold" style={styles.logoutText}>
          Log out
        </ThemedText>
      </Pressable>
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
  segmentSelectedText: {
    fontWeight: '700',
  },
  logout: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#B3261E',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  logoutText: {
    color: '#FFFFFF',
  },
});
