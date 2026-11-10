import { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import type { ImagePickerOptions } from 'expo-image-picker';

import { Avatar } from '@/components/profile/Avatar';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { inkAlpha, Paper, Radius, Spacing } from '@/constants/theme';
import { useProfilePhoto } from '@/hooks/useProfile';
import { confirm, errorMessage } from '@/services/confirm';
import { haptics } from '@/services/haptics';
import { hasNativeFeature, UPDATE_APP_MESSAGE } from '@/services/nativeModules';
import { pickImage } from '@/services/pickImage';
import type { UserProfile } from '@/types';

const PICKER_OPTIONS: ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.7,
};

const SIZE = 112;

/**
 * Profile → Edit: your photo, or your initials. Choose one from the library
 * or take one; it's saved straight away and shows on the leaderboard while
 * you're on it. Removing it asks first, since the file is deleted.
 */
export function ProfilePhotoPicker({ profile, name }: { profile: UserProfile; name: string }) {
  const photo = useProfilePhoto();
  const [problem, setProblem] = useState<string | null>(null);
  const available = hasNativeFeature('imagePicker');
  const busy = photo.isPending;

  const choose = async (source: 'library' | 'camera') => {
    setProblem(null);
    try {
      const image = await pickImage(source, PICKER_OPTIONS);
      if (!image) return;
      await photo.mutateAsync(image);
      haptics.success();
    } catch (error) {
      haptics.error();
      setProblem(errorMessage(error, 'Couldn’t upload that photo.'));
    }
  };

  const remove = async () => {
    const sure = await confirm(
      'Remove your photo?',
      'Your initials show instead, here and on the leaderboard.',
      'Remove',
      { destructive: true },
    );
    if (!sure) return;
    setProblem(null);
    try {
      await photo.mutateAsync(null);
      haptics.success();
    } catch (error) {
      haptics.error();
      setProblem(errorMessage(error, 'Couldn’t remove your photo.'));
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.avatar}>
        <Avatar name={name} url={profile.avatarUrl} cacheKey={profile.avatarPath} size={SIZE} />
        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={Paper} accessibilityLabel="Saving your photo" />
          </View>
        ) : null}
      </View>

      {available ? (
        <View style={styles.buttons}>
          <Button
            label={profile.avatarPath ? 'Change photo' : 'Choose photo'}
            variant="secondary"
            size="small"
            icon="photo"
            disabled={busy}
            onPress={() => choose('library')}
          />
          {Platform.OS !== 'web' ? (
            <Button
              label="Take photo"
              variant="secondary"
              size="small"
              icon="camera"
              disabled={busy}
              onPress={() => choose('camera')}
            />
          ) : null}
          {profile.avatarPath ? (
            <Button
              label="Remove"
              accessibilityLabel="Remove photo"
              variant="danger"
              size="small"
              icon="trash"
              disabled={busy}
              onPress={remove}
            />
          ) : null}
        </View>
      ) : (
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          {UPDATE_APP_MESSAGE}
        </ThemedText>
      )}

      {profile.avatarHidden ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.center} accessibilityRole="alert">
          Someone reported your photo, so it’s hidden from the leaderboard while Mongmo staff look at it. You can still
          change or remove it.
        </ThemedText>
      ) : (
        <ThemedText type="caption" themeColor="textSecondary" style={styles.center}>
          Other members see your photo on the leaderboard, if you’ve joined it.
        </ThemedText>
      )}

      {problem ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert" style={styles.center}>
          {problem}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: Spacing.two + Spacing.one,
    marginVertical: Spacing.two,
  },
  avatar: {
    width: SIZE,
    height: SIZE,
  },
  busy: {
    position: 'absolute',
    inset: 0,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: inkAlpha(0.45),
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  center: {
    textAlign: 'center',
  },
});
