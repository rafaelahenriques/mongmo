import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { confirmWithCode, resendConfirmation } from '@/services/emailConfirmation';
import { haptics } from '@/services/haptics';

/**
 * After creating an account: the 6-digit code from the email, typed here.
 * The right code signs them in. "Back to sign in" is also for someone who
 * confirmed another way (an older email with a link).
 */
export function ConfirmEmailForm({ email, onBack }: { email: string; onBack: () => void }) {
  const [code, setCode] = useState('');
  const [pending, setPending] = useState<'confirm' | 'resend' | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const confirm = async () => {
    setPending('confirm');
    setProblem(null);
    const message = await confirmWithCode(email, code);
    setPending(null);
    if (message) {
      haptics.error();
      setProblem(message);
    } else {
      haptics.success();
    }
  };

  const resend = async () => {
    setPending('resend');
    setProblem(null);
    setResent(false);
    const message = await resendConfirmation(email);
    setPending(null);
    if (message) {
      haptics.error();
      setProblem(message);
    } else {
      setResent(true);
    }
  };

  return (
    <View style={styles.form}>
      <ThemedText type="subtitle" accessibilityRole="header">
        Check your email
      </ThemedText>
      <ThemedText type="small" accessibilityLiveRegion="polite">
        {resent
          ? `We’ve sent a new code to ${email}. The older one no longer works.`
          : `We’ve emailed a 6-digit code to ${email}. Enter it here to finish.`}
      </ThemedText>
      <TextField
        label="Code from the email"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        testID="confirm-code"
      />
      {problem ? (
        <ThemedText type="caption" themeColor="danger" accessibilityRole="alert">
          {problem}
        </ThemedText>
      ) : null}
      <Button label="Confirm" variant="brand" onPress={confirm} loading={pending === 'confirm'} disabled={!!pending} />
      <Button
        label="Send the code again"
        variant="ghost"
        onPress={resend}
        loading={pending === 'resend'}
        disabled={!!pending}
      />
      <Button label="Back to sign in" variant="ghost" onPress={onBack} disabled={!!pending} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
});
