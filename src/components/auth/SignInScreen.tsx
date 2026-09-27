import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FontFamily, Spacing } from '@/constants/theme';
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

  const inputStyle = [
    styles.input,
    { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View
            style={[styles.sticker, { backgroundColor: theme.highlight, borderColor: theme.border }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <ThemedText type="label" style={{ color: theme.onHighlight }}>
              Pop-ups · Points · Pickup
            </ThemedText>
          </View>
          <ThemedText type="title" style={[styles.brand, { color: theme.primary }]} accessibilityRole="header">
            Mongmo
          </ThemedText>
          <ThemedText type="label" themeColor="textSecondary" style={styles.tagline}>
            Cà phê · Bánh mì · Street food
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.tagline}>
            Discover the next flavour — pop-ups, points and pickup, all in one place.
          </ThemedText>
        </View>

        <Card style={styles.form}>
          <ThemedText type="section">{mode === 'sign-in' ? 'Welcome back' : 'Join the crew'}</ThemedText>

          <ThemedText type="label" style={styles.fieldSpacing}>
            Email
          </ThemedText>
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
            style={inputStyle}
          />

          <ThemedText type="label" style={styles.fieldSpacing}>
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
            style={inputStyle}
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

          <Button
            label={mode === 'sign-in' ? 'Sign in' : 'Create account'}
            onPress={onSubmit}
            disabled={!canSubmit}
            loading={pending}
            style={styles.submit}
          />

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
              {mode === 'sign-in' ? 'New to Mongmo? ' : 'Already have an account? '}
              <ThemedText type="smallBold" themeColor="primaryText">
                {mode === 'sign-in' ? 'Create an account' : 'Sign in'}
              </ThemedText>
            </ThemedText>
          </Pressable>
        </Card>
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
    gap: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  sticker: {
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    transform: [{ rotate: '-4deg' }],
    marginBottom: Spacing.two,
  },
  brand: {
    textAlign: 'center',
    fontSize: 76,
    lineHeight: 76,
  },
  tagline: {
    textAlign: 'center',
    maxWidth: 320,
  },
  form: {
    gap: Spacing.one,
    padding: Spacing.four,
  },
  fieldSpacing: {
    marginTop: Spacing.three,
  },
  input: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: Spacing.three,
    fontFamily: FontFamily.body,
    fontSize: 16,
  },
  error: {
    marginTop: Spacing.two,
  },
  submit: {
    marginTop: Spacing.four,
  },
  switchMode: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
});
