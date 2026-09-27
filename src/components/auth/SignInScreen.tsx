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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { haptics } from '@/services/haptics';

type Mode = 'sign-in' | 'sign-up';

/**
 * The only screen a signed-out user can reach — email/password sign in or
 * account creation. Rendered in place of the tabs by Providers, not a
 * router route, so there is nowhere to navigate "back" from.
 */
export default function SignInScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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
        haptics.error();
        setError(authError.message);
      } else {
        haptics.success();
      }
    } finally {
      setPending(false);
    }
  }, [mode, email, password]);

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.five, paddingBottom: insets.bottom + Spacing.four },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Chip label="Pop-ups · Points · Pickup" tone="info" />
          <ThemedText type="display" style={[styles.brand, { color: theme.brand }]} accessibilityRole="header">
            Mongmo
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.tagline}>
            Cà phê, bánh mì and street food. Find the next pop-up, collect points, skip the queue.
          </ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedText type="subtitle">{mode === 'sign-in' ? 'Welcome back' : 'Join the crew'}</ThemedText>

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
            <ThemedText type="small" themeColor="danger" style={styles.error} accessibilityRole="alert">
              {error}
            </ThemedText>
          ) : null}

          <Button
            label={mode === 'sign-in' ? 'Sign in' : 'Create account'}
            variant="brand"
            arrow
            onPress={onSubmit}
            disabled={!canSubmit}
            loading={pending}
            haptic="press"
            style={styles.submit}
          />

          <Pressable
            onPress={() => {
              haptics.select();
              setError(null);
              setMode((current) => (current === 'sign-in' ? 'sign-up' : 'sign-in'));
            }}
            accessibilityRole="button"
            accessibilityLabel={mode === 'sign-in' ? 'Switch to create an account' : 'Switch to sign in'}
            style={styles.switchMode}
          >
            <ThemedText type="small" themeColor="textSecondary">
              {mode === 'sign-in' ? 'New to Mongmo? ' : 'Already have an account? '}
              <ThemedText type="smallBold" themeColor="primaryText">
                {mode === 'sign-in' ? 'Create an account' : 'Sign in'}
              </ThemedText>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three + Spacing.one,
    gap: Spacing.five,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  hero: {
    gap: Spacing.three,
  },
  brand: {
    fontSize: 96,
    lineHeight: 92,
    letterSpacing: -1,
  },
  tagline: {
    maxWidth: 340,
  },
  form: {
    gap: Spacing.two + Spacing.one,
  },
  input: {
    minHeight: 56,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    fontFamily: FontFamily.body,
    fontSize: 16,
  },
  error: {
    paddingHorizontal: Spacing.two,
  },
  submit: {
    marginTop: Spacing.two,
  },
  switchMode: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
