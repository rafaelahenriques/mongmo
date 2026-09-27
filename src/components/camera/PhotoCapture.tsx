import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Radius, Spacing } from '@/constants/theme';
import { haptics } from '@/services/haptics';

export type PhotoCaptureProps = {
  visible: boolean;
  title: string;
  /** Resolves once the photo is captured; the caller handles upload. */
  onCapture: (localUri: string) => void;
  onClose: () => void;
};

/** Full-screen camera used for Capture/Discovery challenge photos. */
export default function PhotoCapture({ visible, title, onCapture, onClose }: PhotoCaptureProps) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);

  const onShutterPress = useCallback(async () => {
    if (!cameraRef.current || capturing) return;
    haptics.press();
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo) onCapture(photo.uri);
    } finally {
      setCapturing(false);
    }
  }, [capturing, onCapture]);

  if (!visible) return null;

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
            <ThemedText type="small" style={[styles.lightText, styles.permissionBody]}>
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
            <Icon name="close" size={20} color="#FFFFFF" weight="bold" />
          </Pressable>
        </View>

        {permission?.granted ? (
          <Pressable
            onPress={onShutterPress}
            disabled={capturing}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            style={[styles.shutterWrap, { bottom: insets.bottom + Spacing.five }]}
          >
            <View style={[styles.shutter, { opacity: capturing ? 0.6 : 1 }]}>
              {capturing ? <ActivityIndicator color="#000000" /> : <Icon name="camera" size={26} color="#000000" />}
            </View>
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  titlePill: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterWrap: {
    position: 'absolute',
    padding: 5,
    borderRadius: Radius.pill,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  shutter: {
    width: 68,
    height: 68,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
  },
  permissionBody: {
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: Spacing.three,
    alignSelf: 'stretch',
  },
  lightText: {
    color: '#FFFFFF',
  },
});
