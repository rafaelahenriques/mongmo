import { useCallback, useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X } from 'lucide-react-native';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type QrScannerProps = {
  visible: boolean;
  title: string;
  onScan: (data: string) => void;
  onClose: () => void;
};

/**
 * Full-screen QR scanner used for event check-in. Debounces so a single
 * held-up code only fires `onScan` once per session; the caller decides
 * whether to close on success or let the user try again.
 */
export default function QrScanner({ visible, title, onScan, onClose }: QrScannerProps) {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  useEffect(() => {
    if (visible) scannedRef.current = false;
  }, [visible]);

  const onBarcodeScanned = useCallback(
    (result: { data: string }) => {
      if (scannedRef.current) return;
      scannedRef.current = true;
      onScan(result.data);
    },
    [onScan],
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={onBarcodeScanned}
          />
        ) : (
          <View style={styles.permissionState}>
            <ThemedText type="smallBold" style={styles.lightText}>
              Camera access needed
            </ThemedText>
            <ThemedText type="small" style={[styles.lightText, styles.permissionBody]}>
              Allow the camera to scan the QR code posted at the venue.
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

        {permission?.granted ? <View style={styles.frame} pointerEvents="none" /> : null}

        <ThemedText type="smallBold" style={[styles.title, styles.lightText]}>
          {title}
        </ThemedText>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close scanner"
          hitSlop={12}
          style={styles.closeButton}
        >
          <X size={26} color="#FFFFFF" />
        </Pressable>
      </View>
    </Modal>
  );
}

const FRAME_SIZE = 240;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 24,
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
