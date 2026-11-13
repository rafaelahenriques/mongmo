import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OpeningScreen } from '@/components/auth/OpeningScreen';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { Wordmark } from '@/components/brand/Wordmark';
import { PrivacyPolicy } from '@/components/privacy/PrivacyPolicy';
import { TermsOfUse } from '@/components/privacy/TermsOfUse';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { BrandPhotoFocus, BrandPhotos } from '@/constants/brandPhotos';
import { useMotion } from '@/constants/motion';
import { PageInset, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { authErrorMessage, MIN_PASSWORD_LENGTH } from '@/services/authMessages';
import { haptics } from '@/services/haptics';
import { useSettingsStore } from '@/state/settingsStore';

type Mode = 'sign-in' | 'sign-up';

/**
 * Everything a signed-out user can reach, rendered in place of the tabs:
 * the Opening screen on the very first launch (W-02), then Welcome (W-04)
 * to sign in, create an account or continue as a guest.
 */
export default function SignInScreen() {
  const openingSeen = useSettingsStore((state) => state.openingSeen);
  const markOpeningSeen = useSettingsStore((state) => state.markOpeningSeen);
  const [mode, setMode] = useState<Mode>('sign-in');

  if (!openingSeen) {
    return (
      <OpeningScreen
        onGetStarted={() => {
          setMode('sign-up');
          markOpeningSeen();
        }}
        onSignIn={() => {
          setMode('sign-in');
          markOpeningSeen();
        }}
      />
    );
  }
  return <WelcomeScreen mode={mode} onModeChange={setMode} />;
}

/** W-04 Welcome: wordmark, photo, email and password, or continue as a guest. */
function WelcomeScreen({ mode, onModeChange }: { mode: Mode; onModeChange: (mode: Mode) => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState<'account' | 'guest' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // Older accounts may have 6-character passwords; new ones need more.
  const minLength = mode === 'sign-in' ? 6 : MIN_PASSWORD_LENGTH;
  const canSubmit = email.trim().length > 3 && password.length >= minLength && !pending;

  const onSubmit = useCallback(async () => {
    setError(null);
    setNotice(null);
    setPending('account');
    const address = email.trim();
    try {
      const { data, error: authError } =
        mode === 'sign-in'
          ? await supabase.auth.signInWithPassword({ email: address, password })
          : await supabase.auth.signUp({ email: address, password });
      if (authError) {
        haptics.error();
        setError(
          authError.code === 'email_not_confirmed'
            ? `Confirm your email first: open the link we sent to ${address}.`
            : authErrorMessage(authError),
        );
      } else if (!data.session) {
        // The project asks new accounts to confirm their email before they
        // can sign in: say so, and have them sign in once they have.
        haptics.success();
        setNotice(
          `Check your email: we sent a link to ${address}. Open it to confirm your account, then sign in here.`,
        );
        setPassword('');
        onModeChange('sign-in');
      } else {
        haptics.success();
      }
    } finally {
      setPending(null);
    }
  }, [mode, email, password, onModeChange]);

  const onGuest = useCallback(async () => {
    setError(null);
    setPending('guest');
    try {
      const { error: authError } = await supabase.auth.signInAnonymously();
      if (authError) {
        haptics.error();
        setError(authErrorMessage(authError));
      } else {
        haptics.success();
      }
    } finally {
      setPending(null);
    }
  }, []);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 54, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <ThemedText type="captionBold">Pick-Up · Pop Ups · Discounts</ThemedText>
          <Wordmark height={78} />
        </View>

        {BrandPhotos.welcome ? (
          <Image
            accessible={false}
            accessibilityLabel=""
            source={BrandPhotos.welcome}
            style={styles.photo}
            contentFit="cover"
            contentPosition={BrandPhotoFocus.welcome}
            accessibilityIgnoresInvertColors
          />
        ) : null}

        <ThemedText type="name" accessibilityRole="header">
          {mode === 'sign-in' ? 'Welcome' : 'Join us'}
        </ThemedText>

        {resetting ? (
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
              placeholder="Email"
              hideLabel
              testID="email"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'sign-in' ? 'password' : 'password-new'}
              textContentType={mode === 'sign-in' ? 'password' : 'newPassword'}
              placeholder={mode === 'sign-in' ? 'Password' : `Password (${MIN_PASSWORD_LENGTH} characters or more)`}
              hideLabel
              testID="password"
            />

            {error ? (
              <ThemedText type="caption" themeColor="danger" accessibilityRole="alert">
                {error}
              </ThemedText>
            ) : null}
            {notice ? (
              <View
                style={[styles.notice, { backgroundColor: theme.backgroundSelected }]}
                accessibilityLiveRegion="polite"
              >
                <ThemedText type="small">{notice}</ThemedText>
              </View>
            ) : null}

            <Button
              label={mode === 'sign-in' ? 'Sign in' : 'Create account'}
              variant="brand"
              onPress={onSubmit}
              disabled={!canSubmit}
              loading={pending === 'account'}
              haptic="press"
            />

            {mode === 'sign-in' ? (
              <Pressable
                onPress={() => {
                  haptics.select();
                  setError(null);
                  setNotice(null);
                  setResetting(true);
                }}
                accessibilityRole="button"
                hitSlop={10}
                style={styles.switch}
              >
                <ThemedText type="captionBold">Forgot your password?</ThemedText>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => {
                haptics.select();
                setError(null);
                setNotice(null);
                onModeChange(mode === 'sign-in' ? 'sign-up' : 'sign-in');
              }}
              accessibilityRole="button"
              hitSlop={10}
              style={styles.switch}
            >
              <ThemedText type="captionBold">
                {mode === 'sign-in' ? 'New to Mongmo? Create an account' : 'Already have an account? Sign in'}
              </ThemedText>
            </Pressable>

            <Button
              label="Continue as guest"
              variant="ghost"
              onPress={onGuest}
              loading={pending === 'guest'}
              disabled={pending === 'account'}
              accessibilityHint="Look around without an account. You can create one later to keep your points."
            />

            <LegalLinks />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * Agreeing to the terms: creating an account or going on as a guest means
 * agreeing to them, so they (and the privacy policy) open from here,
 * before anyone is signed in.
 */
function LegalLinks() {
  const theme = useTheme();
  const motion = useMotion();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<'terms' | 'privacy' | null>(null);
  const close = () => setOpen(null);
  return (
    <View style={styles.legal}>
      <ThemedText type="caption" themeColor="textSecondary" style={styles.center}>
        By creating an account or continuing as a guest, you agree to our terms of use. Our privacy policy explains how
        we use your data.
      </ThemedText>
      <View style={styles.legalLinks}>
        <Button label="Terms of use" variant="ghost" size="small" onPress={() => setOpen('terms')} />
        <Button label="Privacy policy" variant="ghost" size="small" onPress={() => setOpen('privacy')} />
      </View>
      <Modal visible={open !== null} animationType={motion.sheet} presentationStyle="pageSheet" onRequestClose={close}>
        <View style={[styles.flex, { paddingTop: insets.top, backgroundColor: theme.background }]}>
          {open === 'terms' ? (
            <TermsOfUse onClose={close} bottomInset={insets.bottom + 32} />
          ) : open === 'privacy' ? (
            <PrivacyPolicy onClose={close} bottomInset={insets.bottom + 32} />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  legal: {
    gap: 8,
    alignItems: 'center',
  },
  center: {
    textAlign: 'center',
  },
  legalLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: PageInset + 32,
    gap: 28,
  },
  brand: {
    gap: 16,
  },
  notice: {
    padding: 12,
  },
  photo: {
    width: '100%',
    aspectRatio: 300 / 170,
    borderRadius: Radius.medium,
  },
  form: {
    gap: 12,
  },
  switch: {
    alignSelf: 'center',
    paddingVertical: 14,
  },
});
