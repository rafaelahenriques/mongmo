import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Avatar } from '@/components/profile/Avatar';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { PROFILE_LIMITS } from '@/constants/profile';
import { Spacing } from '@/constants/theme';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import type { UserProfile } from '@/types';

/** Profile → Edit: display name (shown on the leaderboard), home city and bio. */
export default function ProfileEditScreen() {
  const theme = useTheme();
  const profile = useProfile();

  if (!profile.data) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }
  return <ProfileForm profile={profile.data} />;
}

function ProfileForm({ profile }: { profile: UserProfile }) {
  const theme = useTheme();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const save = useUpdateProfile();

  const [name, setName] = useState(profile.name);
  const [homeCity, setHomeCity] = useState(profile.homeCity);
  const [bio, setBio] = useState(profile.bio);

  const trimmedName = name.trim();
  const changed = trimmedName !== profile.name || homeCity.trim() !== profile.homeCity || bio.trim() !== profile.bio;
  const nameProblem = trimmedName ? null : 'Your name can’t be empty.';

  const onSave = () => {
    if (nameProblem) {
      haptics.error();
      return;
    }
    save.mutate(
      { name, bio, homeCity },
      {
        onSuccess: () => {
          haptics.success();
          router.back();
        },
        onError: () => haptics.error(),
      },
    );
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
        <View style={styles.avatar}>
          <Avatar name={trimmedName || profile.name} url={profile.avatarUrl} size={96} />
        </View>

        <Card style={styles.group}>
          <TextField
            label="Display name"
            value={name}
            onChangeText={setName}
            maxLength={PROFILE_LIMITS.name}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            hint="Shown on your profile and the leaderboard."
          />
          <TextField
            label="Home city"
            value={homeCity}
            onChangeText={setHomeCity}
            maxLength={PROFILE_LIMITS.homeCity}
            autoCapitalize="words"
            placeholder="e.g. Kortrijk"
          />
          <TextField
            label="Bio"
            value={bio}
            onChangeText={setBio}
            maxLength={PROFILE_LIMITS.bio}
            multiline
            placeholder="Your go-to order, favourite pop-up…"
            hint={`${bio.length} / ${PROFILE_LIMITS.bio}`}
          />
        </Card>

        {nameProblem ?? save.error?.message ? (
          <ThemedText type="smallBold" themeColor="danger" accessibilityRole="alert">
            {nameProblem ?? save.error?.message}
          </ThemedText>
        ) : null}

        <Button
          label="Save"
          accessibilityLabel="Save profile"
          variant="brand"
          icon="check"
          haptic="press"
          disabled={!changed || Boolean(nameProblem)}
          loading={save.isPending}
          onPress={onSave}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.three + Spacing.one,
    gap: Spacing.three,
  },
  avatar: {
    alignItems: 'center',
    marginVertical: Spacing.two,
  },
  group: {
    gap: Spacing.three,
  },
});
