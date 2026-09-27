import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera, X } from 'lucide-react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type PhotoCaptureProps = {
  visible: boolean;
  title: string;
  /** Resolves once the photo is captured; the caller handles upload. */
  onCapture: (localUri: string) => void;
  onClose: () => void;
};

/** Full-screen camera used for Capture/Discovery challenge photos. */
export default function PhotoCapture({ visible, title, onCapture, onClose }: PhotoCaptureProps) {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);

  const onShutterPress = useCallback(async () => {
    if (!cameraRef.current || capturing) return;
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
            <Pressable
              onPress={requestPermission}
              accessibilityRole="button"
              accessibilityLabel="Allow camera access"
              style={[styles.permissionButton, { backgroundColor: theme.text }]}
            >
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                Allow camera
              </ThemedText>
            </Pressable>
          </View>
        )}

        <ThemedText type="smallBold" style={[styles.title, styles.lightText]}>
          {title}
        </ThemedText>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close camera"
          hitSlop={12}
          style={styles.closeButton}
        >
          <X size={26} color="#FFFFFF" />
        </Pressable>

        {permission?.granted ? (
          <Pressable
            onPress={onShutterPress}
            disabled={capturing}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            style={styles.shutterWrap}
          >
            <View style={[styles.shutter, { opacity: capturing ? 0.6 : 1 }]}>
              {capturing ? <ActivityIndicator color="#000000" /> : <Camera size={26} color="#000000" />}
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
  title: {
    position: 'absolute',
    top: 64,
    left: Spacing.four,
    right: Spacing.four,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: Spacing.three,
    padding: Spacing.two,
  },
  shutterWrap: {
    position: 'absolute',
    bottom: 48,
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    marginTop: Spacing.two,
    minHeight: 44,
    paddingHorizontal: Spacing.four,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightText: {
    color: '#FFFFFF',
  },
});
