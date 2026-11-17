import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmEmailForm } from '@/components/auth/ConfirmEmailForm';
import { LegalLinks } from '@/components/auth/LegalLinks';
import { OpeningScreen } from '@/components/auth/OpeningScreen';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { TextField } from '@/components/ui/TextField';
import { PageInset } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { authErrorMessage, MIN_PASSWORD_LENGTH } from '@/services/authMessages';
import { alreadyRegistered } from '@/services/emailConfirmation';
import { clearWelcomeMode, welcomeMode, type AuthMode } from '@/services/guest';
import { haptics } from '@/services/haptics';

/**
 * Everything a signed-out person can reach, in place of the tabs: the
 * Opening landing (W-02: create an account, sign in, or skip to look
 * around as a guest), then the short form for whichever they picked
 * (W-04). A guest who asked to sign in or make an account goes straight
 * to that form.
 */
export default function SignInScreen() {
  const [step, setStep] = useState<AuthMode | 'landing'>(() => welcomeMode() ?? 'landing');
  useEffect(() => clearWelcomeMode(), []);
  const [guestPending, setGuestPending] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  const onGuest = useCallback(async () => {
    setGuestError(null);
    setGuestPending(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        haptics.error();
        setGuestError(authErrorMessage(error));
      } else {
        haptics.success();
      }
    } finally {
      setGuestPending(false);
    }
  }, []);

  if (step === 'landing') {
    return (
      <OpeningScreen
        onCreateAccount={() => setStep('sign-up')}
        onSignIn={() => setStep('sign-in')}
        onGuest={() => void onGuest()}
        guestPending={guestPending}
        guestError={guestError}
      />
    );
  }
  return <AccountForm mode={step} onModeChange={setStep} onBack={() => setStep('landing')} />;
}

const COPY: Record<AuthMode, { title: string; line: string; switchTo: string }> = {
  'sign-in': {
    title: 'Welcome back',
    line: 'Sign in to order ahead and collect your points.',
    switchTo: 'Create account',
  },
  'sign-up': {
    title: 'Join Mongmo',
    line: 'Order ahead, collect points and unlock rewards.',
    switchTo: 'Sign in',
  },
};

/**
 * W-04: the short form. A title, email and password, one button. The
 * other form is a tap away at the top right, as is the way back.
 */
function AccountForm({
  mode,
  onModeChange,
  onBack,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onBack: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  /** The address whose 6-digit code we're waiting for, after creating an account. */
  const [confirming, setConfirming] = useState<string | null>(null);

  // Older accounts may have 6-character passwords; new ones need more.
  const minLength = mode === 'sign-in' ? 6 : MIN_PASSWORD_LENGTH;
  const canSubmit = email.trim().length > 3 && password.length >= minLength && !pending;
  const copy = COPY[mode];
  const onForm = !confirming && !resetting;

  const onSubmit = useCallback(async () => {
    setError(null);
    setPending(true);
    const address = email.trim();
    try {
      const { data, error: authError } =
        mode === 'sign-in'
          ? await supabase.auth.signInWithPassword({ email: address, password })
          : await supabase.auth.signUp({ email: address, password });
      if (authError?.code === 'email_not_confirmed') {
        // They made the account but never entered the code: ask for it now.
        setPassword('');
        setConfirming(address);
      } else if (authError) {
        haptics.error();
        setError(authErrorMessage(authError));
      } else if (mode === 'sign-up' && alreadyRegistered(data.user)) {
        haptics.error();
        setError('There’s already an account with that email. Sign in instead.');
        setPassword('');
        onModeChange('sign-in');
      } else if (!data.session) {
        // The project asks new accounts to confirm their email: the code
        // from that email, typed here, signs them in.
        haptics.success();
        setPassword('');
        onModeChange('sign-in');
        setConfirming(address);
      } else {
        haptics.success();
      }
    } finally {
      setPending(false);
    }
  }, [mode, email, password, onModeChange]);

  const switchMode = () => {
    haptics.select();
    setError(null);
    onModeChange(mode === 'sign-in' ? 'sign-up' : 'sign-in');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <IconButton icon="chevronLeft" tone="muted" onPress={onBack} accessibilityLabel="Back" />
          {onForm ? (
            <Pressable onPress={switchMode} accessibilityRole="button" hitSlop={8} style={styles.switch}>
              <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
                {copy.switchTo}
              </ThemedText>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.heading}>
          <ThemedText type="title" accessibilityRole="header" headingLevel={1}>
            {copy.title}
          </ThemedText>
          {onForm ? (
            <ThemedText type="caption" themeColor="textSecondary">
              {copy.line}
            </ThemedText>
          ) : null}
        </View>

        {confirming ? (
          <ConfirmEmailForm email={confirming} onBack={() => setConfirming(null)} />
        ) : resetting ? (
          <ResetPasswordForm initialEmail={email} onDone={() => setResetting(false)} />
        ) : (
          <View style={styles.form}>
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
              placeholder="you@example.com"
              testID="email"
            />
            <View style={styles.password}>
              <TextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={mode === 'sign-in' ? 'password' : 'password-new'}
                textContentType={mode === 'sign-in' ? 'password' : 'newPassword'}
                hint={mode === 'sign-up' ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined}
                testID="password"
              />
              {mode === 'sign-in' ? (
                <Pressable
                  onPress={() => {
                    haptics.select();
                    setError(null);
                    setResetting(true);
                  }}
                  accessibilityRole="button"
                  hitSlop={8}
                  style={styles.forgot}
                >
                  <ThemedText type="captionBold">Forgot your password?</ThemedText>
                </Pressable>
              ) : null}
            </View>

            {error ? (
              <ThemedText type="caption" themeColor="danger" accessibilityRole="alert">
                {error}
              </ThemedText>
            ) : null}

            <Button
              label={mode === 'sign-in' ? 'Sign in' : 'Create account'}
              variant="brand"
              onPress={onSubmit}
              disabled={!canSubmit}
              loading={pending}
              haptic="press"
            />
            {mode === 'sign-up' ? (
              <LegalLinks agreement="By creating an account, you agree to our terms of use." />
            ) : null}
          </View>
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
    paddingHorizontal: PageInset,
    gap: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // At least 44 tall to tap, though it reads as a link.
  switch: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  heading: {
    gap: 8,
  },
  form: {
    gap: 16,
  },
  password: {
    gap: 4,
  },
  forgot: {
    alignSelf: 'flex-end',
    minHeight: 44,
    justifyContent: 'center',
  },
});
