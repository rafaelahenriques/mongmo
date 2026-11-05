import { useState } from 'react';
import { AccessibilityInfo, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { changePassword } from '@/services/auth';
import { haptics } from '@/services/haptics';

/** Same rule as signing up. */
const MIN_LENGTH = 6;

/**
 * Settings → Change password: the current password (checked first), then
 * the new one twice. Says so when it's done.
 */
export default function ChangePasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const user = useAuthUser();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const mismatch = again.length > 0 && again.length >= next.length && again !== next;
  const canSubmit = current.length > 0 && next.length >= MIN_LENGTH && again === next && !pending;

  const onSubmit = async () => {
    setError(null);
    setPending(true);
    try {
      const problem = await changePassword(current, next);
      if (problem) {
        haptics.error();
        setError(problem);
        return;
      }
      haptics.success();
      AccessibilityInfo.announceForAccessibility('Password changed.');
      setDone(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + Spacing.five }]}
        keyboardShouldPersistTaps="handled"
      >
        {user.data?.email ? (
          <ThemedText type="caption" themeColor="textSecondary">
            Signed in as{' '}
            <ThemedText type="captionBold" selectable>
              {user.data.email}
            </ThemedText>
          </ThemedText>
        ) : null}

        {done ? (
          <View style={styles.done} accessibilityLiveRegion="polite">
            <ThemedText type="section">Password changed</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Use your new password next time you sign in.
            </ThemedText>
            <Button label="Done" variant="brand" onPress={() => router.back()} />
          </View>
        ) : (
          <>
            <Card style={styles.group}>
              <TextField
                label="Current password"
                value={current}
                onChangeText={setCurrent}
                secureTextEntry
                autoComplete="current-password"
                textContentType="password"
              />
              <TextField
                label="New password"
                value={next}
                onChangeText={setNext}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                hint={`${MIN_LENGTH} characters or more.`}
              />
              <TextField
                label="New password again"
                value={again}
                onChangeText={setAgain}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                onSubmitEditing={canSubmit ? () => void onSubmit() : undefined}
              />
            </Card>

            {(error ?? mismatch) ? (
              <ThemedText type="smallBold" themeColor="danger" accessibilityRole="alert">
                {error ?? 'The new passwords don’t match.'}
              </ThemedText>
            ) : null}

            <Button
              label="Change password"
              variant="brand"
              haptic="press"
              disabled={!canSubmit}
              loading={pending}
              onPress={() => void onSubmit()}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.three + Spacing.one,
    gap: Spacing.three,
  },
  group: {
    gap: Spacing.three,
  },
  done: {
    gap: Spacing.two,
  },
});
