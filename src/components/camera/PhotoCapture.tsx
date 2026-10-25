import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Ink, inkAlpha, Paper, paperAlpha, Radius, Spacing } from '@/constants/theme';
import { haptics } from '@/services/haptics';

export type PhotoCaptureProps = {
  visible: boolean;
  title: string;
  /** What to photograph, shown under the title. */
  prompt?: string;
  /** How many photos the challenge needs. */
  count: number;
  /** All `count` photos, in the order taken; the caller uploads them. */
  onDone: (uris: string[]) => void;
  onClose: () => void;
};

/**
 * Full-screen camera for Capture/Discovery challenges. Takes `count` photos,
 * shows them as thumbnails (tap one to retake it), then hands them back.
 */
export default function PhotoCapture(props: PhotoCaptureProps) {
  // Mounted only while open, so every opening starts a fresh set of shots.
  return props.visible ? <CaptureSession {...props} /> : null;
}

function CaptureSession({ visible, title, prompt, count, onDone, onClose }: PhotoCaptureProps) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);
  const [shots, setShots] = useState<string[]>([]);

  const complete = shots.length >= count;

  const onShutterPress = useCallback(async () => {
    if (!cameraRef.current || capturing || complete) return;
    haptics.press();
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo) setShots((current) => [...current, photo.uri]);
    } finally {
      setCapturing(false);
    }
  }, [capturing, complete]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {permission?.granted ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        ) : (
          <View style={styles.permissionState}>
            <ThemedText type="smallBold" style={styles.lightText}>
              Camera access needed
            </ThemedText>
            <ThemedText type="small" style={[styles.lightText, styles.center]}>
              Allow the camera to take your challenge photo.
            </ThemedText>
            <Button
              label="Allow camera"
              accessibilityLabel="Allow camera access"
              icon="camera"
              variant="brand"
              onPress={requestPermission}
              style={styles.permissionButton}
            />
          </View>
        )}

        <View style={[styles.topBar, { top: insets.top + Spacing.two }]}>
          <View style={styles.titlePill}>
            <ThemedText type="smallBold" style={styles.lightText} numberOfLines={1}>
              {title}
            </ThemedText>
            {prompt ? (
              <ThemedText type="small" style={styles.dimText} numberOfLines={2}>
                {prompt}
              </ThemedText>
            ) : null}
          </View>
          <Pressable
            onPress={() => {
              haptics.tap();
              onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel="Close camera"
            hitSlop={12}
            style={styles.closeButton}
          >
            <Icon name="close" size={20} color={Paper} weight="bold" />
          </Pressable>
        </View>

        {permission?.granted ? (
          <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.four }]}>
            {count > 1 || shots.length > 0 ? (
              <ScrollView horizontal contentContainerStyle={styles.thumbs} showsHorizontalScrollIndicator={false}>
                {Array.from({ length: count }, (_, index) => {
                  const uri = shots[index];
                  return uri ? (
                    <Pressable
                      key={index}
                      onPress={() => {
                        haptics.select();
                        setShots((current) => current.filter((_, at) => at !== index));
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Retake photo ${index + 1}`}
                    >
                      <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
                      <View style={styles.thumbBadge}>
                        <Icon name="repeat" size={11} color={Paper} />
                      </View>
                    </Pressable>
                  ) : (
                    <View key={index} style={[styles.thumb, styles.thumbEmpty]}>
                      <ThemedText type="smallBold" style={styles.dimText}>
                        {index + 1}
                      </ThemedText>
                    </View>
                  );
                })}
              </ScrollView>
            ) : null}

            {complete ? (
              <Button
                label={count === 1 ? 'Use this photo' : `Use these ${count} photos`}
                variant="brand"
                icon="check"
                haptic="press"
                onPress={() => onDone(shots)}
                style={styles.useButton}
              />
            ) : (
              <Pressable
                onPress={onShutterPress}
                disabled={capturing}
                accessibilityRole="button"
                accessibilityLabel={count > 1 ? `Take photo ${shots.length + 1} of ${count}` : 'Take photo'}
                style={styles.shutterRing}
              >
                <View style={[styles.shutter, { opacity: capturing ? 0.6 : 1 }]}>
                  {capturing ? <ActivityIndicator color={Ink} /> : <Icon name="camera" size={26} color={Ink} />}
                </View>
              </Pressable>
            )}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  titlePill: {
    flex: 1,
    backgroundColor: inkAlpha(0.55),
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    gap: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: inkAlpha(0.55),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    gap: Spacing.three,
  },
  thumbs: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.small,
  },
  thumbEmpty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: paperAlpha(0.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 18,
    height: 18,
    borderRadius: Radius.pill,
    backgroundColor: inkAlpha(0.6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterRing: {
    padding: 5,
    borderRadius: Radius.pill,
    borderWidth: 3,
    borderColor: Paper,
  },
  shutter: {
    width: 68,
    height: 68,
    borderRadius: Radius.pill,
    backgroundColor: Paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useButton: {
    alignSelf: 'stretch',
    marginHorizontal: Spacing.three,
  },
  permissionState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
  },
  permissionButton: {
    marginTop: Spacing.three,
    alignSelf: 'stretch',
  },
  center: {
    textAlign: 'center',
  },
  lightText: {
    color: Paper,
  },
  dimText: {
    color: paperAlpha(0.8),
  },
});
