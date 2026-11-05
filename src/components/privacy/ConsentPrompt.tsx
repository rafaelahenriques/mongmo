import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { CardShadow, PageInset } from '@/constants/theme';
import { useSettingsHydrated } from '@/hooks/useSettingsHydrated';
import { useTheme } from '@/hooks/useTheme';
import { crashReportingAvailable } from '@/lib/crashReporting';
import { useSettingsStore } from '@/state/settingsStore';

/**
 * The one optional thing the app could send: crash reports. Asked once, at
 * the bottom of the first screen, before anything is loaded or sent.
 * Saying no is as easy as saying yes (two equal buttons, side by side), and
 * the answer can be changed any time in Settings → Privacy.
 */
export function ConsentPrompt({ onOpenPolicy }: { onOpenPolicy?: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const hydrated = useSettingsHydrated();
  const choice = useSettingsStore((state) => state.crashReports);
  const setChoice = useSettingsStore((state) => state.setCrashReports);

  if (!crashReportingAvailable || !hydrated || choice !== 'unasked') return null;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, boxShadow: CardShadow, paddingBottom: insets.bottom + 16 },
      ]}
      accessibilityViewIsModal
      aria-label="Crash reports"
    >
      <ThemedText type="section" accessibilityRole="header">
        Help us fix crashes?
      </ThemedText>
      <ThemedText type="small">
        If the app crashes, it can send us a report: what went wrong in the code, your phone model and the app version.
        Never your name, email, location or anything you type. You can change this any time in Settings.
      </ThemedText>
      {onOpenPolicy ? (
        <Button label="Read the privacy policy" variant="ghost" size="small" onPress={onOpenPolicy} />
      ) : null}
      <View style={styles.buttons}>
        <Button label="Don’t send" variant="secondary" onPress={() => setChoice('off')} style={styles.button} />
        <Button label="Send reports" variant="secondary" onPress={() => setChoice('on')} style={styles.button} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: PageInset,
    paddingTop: 20,
    gap: 12,
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  button: {
    flexGrow: 1,
    flexBasis: 140,
  },
});
