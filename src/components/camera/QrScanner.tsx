import { useCallback, useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Ink, inkAlpha, Paper, Radius, Spacing } from '@/constants/theme';
import { haptics } from '@/services/haptics';

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
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  useEffect(() => {
    if (visible) scannedRef.current = false;
  }, [visible]);

  const onBarcodeScanned = useCallback(
    (result: { data: string }) => {
      if (scannedRef.current) return;
      scannedRef.current = true;
      haptics.press();
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

        {permission?.granted ? <View style={styles.frame} pointerEvents="none" /> : null}

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
            accessibilityLabel="Close scanner"
            hitSlop={12}
            style={styles.closeButton}
          >
            <Icon name="close" size={20} color={Paper} weight="bold" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const FRAME_SIZE = 240;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderWidth: 4,
    borderColor: Paper,
    borderRadius: 32,
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
    backgroundColor: inkAlpha(0.55),
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: inkAlpha(0.55),
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
    color: Paper,
  },
});
