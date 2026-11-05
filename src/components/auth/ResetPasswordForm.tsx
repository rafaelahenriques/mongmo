import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { haptics } from '@/services/haptics';
import { MIN_PASSWORD_LENGTH } from '@/services/authMessages';
import { resetWithCode, sendResetCode } from '@/services/passwordReset';

/**
 * Forgot password, in two steps on the sign-in screen: your email, then the
 * code we sent and a new password. Setting it signs you in.
 */
export function ResetPasswordForm({ initialEmail, onDone }: { initialEmail: string; onDone: () => void }) {
  const [email, setEmail] = useState(initialEmail);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const send = async () => {
    setPending(true);
    setProblem(null);
    const message = await sendResetCode(email);
    setPending(false);
    if (message) {
      haptics.error();
      setProblem(message);
    } else {
      haptics.success();
      setCodeSent(true);
    }
  };

  const reset = async () => {
    setPending(true);
    setProblem(null);
    const message = await resetWithCode(email, code, password);
    setPending(false);
    if (message) {
      haptics.error();
      setProblem(message);
    } else {
      haptics.success();
    }
  };

  return (
    <View style={styles.form}>
      <ThemedText type="subtitle" accessibilityRole="header">
        Reset your password
      </ThemedText>
      {codeSent ? (
        <>
          <ThemedText type="small" accessibilityLiveRegion="polite">
            {`If there’s an account for ${email.trim()}, we’ve emailed it a 6-digit code. It works for an hour.`}
          </ThemedText>
          <TextField
            label="Code from the email"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
          />
          <TextField
            label="New password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
            textContentType="newPassword"
            hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          />
        </>
      ) : (
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
      )}
      {problem ? (
        <ThemedText type="caption" themeColor="danger" accessibilityRole="alert">
          {problem}
        </ThemedText>
      ) : null}
      {codeSent ? (
        <Button label="Set new password" variant="brand" onPress={reset} loading={pending} />
      ) : (
        <Button label="Email me a code" variant="brand" onPress={send} loading={pending} />
      )}
      <Button label="Back to sign in" variant="ghost" onPress={onDone} disabled={pending} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
});
