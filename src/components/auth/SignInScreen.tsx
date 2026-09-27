import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

type Mode = 'sign-in' | 'sign-up';

/**
 * The only screen a signed-out user can reach — email/password sign in or
 * account creation. Rendered in place of the tabs by Providers, not a
 * router route, so there is nowhere to navigate "back" from.
 */
export default function SignInScreen() {
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 3 && password.length >= 6 && !pending;

  const onSubmit = useCallback(async () => {
    setError(null);
    setPending(true);
    try {
      const { error: authError } =
        mode === 'sign-in'
          ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
          : await supabase.auth.signUp({ email: email.trim(), password });
      if (authError) {
        setError(authError.message);
      }
    } finally {
      setPending(false);
    }
  }, [mode, email, password]);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText type="title" style={styles.brand}>
          Mongmo
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.tagline}>
          Discover the next flavour — pop-ups, points and pickup, all in one place.
        </ThemedText>

        <View style={styles.form}>
          <ThemedText type="smallBold">Email</ThemedText>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="you@example.com"
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="Email"
            style={[
              styles.input,
              { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
            ]}
          />

          <ThemedText type="smallBold" style={styles.fieldSpacing}>
            Password
          </ThemedText>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'sign-in' ? 'password' : 'password-new'}
            textContentType={mode === 'sign-in' ? 'password' : 'newPassword'}
            placeholder="At least 6 characters"
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="Password"
            style={[
              styles.input,
              { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
            ]}
          />

          {error ? (
            <ThemedText
              type="small"
              themeColor="danger"
              style={styles.error}
              accessibilityRole="alert"
            >
              {error}
            </ThemedText>
          ) : null}

          <Pressable
            onPress={onSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel={mode === 'sign-in' ? 'Sign in' : 'Create account'}
            accessibilityState={{ disabled: !canSubmit }}
            style={({ pressed }) => [
              styles.submit,
              {
                backgroundColor: '#8B4513',
                opacity: !canSubmit ? 0.6 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {pending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText type="smallBold" style={styles.submitText}>
                {mode === 'sign-in' ? 'Sign in' : 'Create account'}
              </ThemedText>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              setError(null);
              setMode((current) => (current === 'sign-in' ? 'sign-up' : 'sign-in'));
            }}
            accessibilityRole="button"
            accessibilityLabel={
              mode === 'sign-in' ? 'Switch to create an account' : 'Switch to sign in'
            }
            style={styles.switchMode}
          >
            <ThemedText type="small" themeColor="textSecondary">
              {mode === 'sign-in'
                ? "New to Mongmo? Create an account"
                : 'Already have an account? Sign in'}
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  brand: {
    textAlign: 'center',
    fontSize: 34,
    lineHeight: 40,
  },
  tagline: {
    textAlign: 'center',
    marginTop: Spacing.one,
    marginBottom: Spacing.five,
  },
  form: {
    gap: Spacing.one,
  },
  fieldSpacing: {
    marginTop: Spacing.three,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
  },
  error: {
    marginTop: Spacing.two,
  },
  submit: {
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  submitText: {
    color: '#FFFFFF',
  },
  switchMode: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
});
