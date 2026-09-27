import { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { uploadEventImage } from '@/api/eventImages';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [16, 9],
  quality: 0.8,
};

/**
 * The pop-up's cover photo: pick one from the library or take one, and it's
 * uploaded straight away (the form then saves its URL with the pop-up).
 */
export function EventImagePicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const theme = useTheme();
  const [uploading, setUploading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const choose = async (source: 'library' | 'camera') => {
    setProblem(null);
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setProblem('Camera access is off for Mongmo — allow it in Settings to take a photo.');
          return;
        }
      }
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
          : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
      const asset = result.canceled ? undefined : result.assets[0];
      if (!asset) return;

      setUploading(true);
      onChange(await uploadEventImage({ uri: asset.uri, mimeType: asset.mimeType }));
      haptics.success();
    } catch (error) {
      haptics.error();
      setProblem(error instanceof Error ? error.message : 'Couldn’t upload that photo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.preview, { backgroundColor: theme.backgroundSelected }]}>
        {value ? (
          <Image
            source={{ uri: value }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            accessibilityLabel="The pop-up's photo"
          />
        ) : (
          <View style={styles.placeholder}>
            <IconBadge name="photo" tone="card" size={52} />
            <ThemedText type="small" themeColor="textSecondary">
              No photo yet
            </ThemedText>
          </View>
        )}
        {uploading ? (
          <View style={styles.uploading}>
            <ActivityIndicator color="#FFFFFF" accessibilityLabel="Uploading photo" />
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button
          label={value ? 'Change photo' : 'Choose photo'}
          variant="primary"
          size="medium"
          icon="photo"
          disabled={uploading}
          onPress={() => choose('library')}
          style={styles.flex}
        />
        {Platform.OS !== 'web' ? (
          <Button
            label="Take photo"
            variant="ghost"
            size="medium"
            icon="camera"
            disabled={uploading}
            onPress={() => choose('camera')}
            style={styles.flex}
          />
        ) : null}
      </View>
      {value ? (
        <Button label="Remove photo" variant="danger" size="small" icon="trash" onPress={() => onChange('')} />
      ) : null}

      {problem ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {problem}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  preview: {
    aspectRatio: 16 / 9,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  uploading: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
