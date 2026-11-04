import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';

import { ChallengeFrame } from '@/components/challenges/ChallengeFrame';
import { ThemedText } from '@/components/ThemedText';
import { Icon } from '@/components/ui/Icon';
import { TextLink } from '@/components/ui/TextLink';
import { Colors, Paper, paperAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';

export type PhotoCaptureProps = {
  /** The challenge's name, in the top bar. */
  title: string;
  points: number;
  /** The big line: "Before the first sip". */
  heading: string;
  /** What to photograph: "Take 1 photo of your cà phê". */
  prompt?: string;
  /** How many photos the challenge needs. */
  count: number;
  /** Uploading and completing; the Send block spins meanwhile. */
  sending: boolean;
  /** All `count` photos, in the order taken; the caller uploads them. */
  onSend: (uris: string[]) => void;
  onClose: () => void;
};

/** The camera area: grey until the camera shows, whatever the theme. */
const VIEWFINDER = Colors.light.textSecondary;

/**
 * X-02 Photo challenge: the camera fills a grey area under the heading and
 * TAKE PHOTO sits at the bottom. After the shot: the preview, Retake, and
 * SEND. With more than one photo to take, the shots line up underneath
 * (tap one to take it again). Mounted only while open, so every opening
 * starts a fresh set.
 */
export default function PhotoCapture({
  title,
  points,
  heading,
  prompt,
  count,
  sending,
  onSend,
  onClose,
}: PhotoCaptureProps) {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);
  const [shots, setShots] = useState<string[]>([]);

  const complete = shots.length >= count;
  const last = shots[shots.length - 1];

  const takePhoto = async () => {
    if (!cameraRef.current || capturing || complete) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo) setShots((current) => [...current, photo.uri]);
    } finally {
      setCapturing(false);
    }
  };

  const retake = (index: number) => {
    haptics.select();
    setShots((current) => current.filter((_, at) => at !== index));
  };

  const action = !permission?.granted
    ? { label: 'Allow camera', onPress: requestPermission, disabled: !permission?.canAskAgain && permission !== null }
    : complete
      ? { label: 'Send', value: `+${points}`, onPress: () => onSend(shots), loading: sending }
      : {
          label: count > 1 ? `Take photo ${shots.length + 1} of ${count}` : 'Take photo',
          onPress: takePhoto,
          loading: capturing,
        };

  return (
    <ChallengeFrame title={title} points={points} heading={heading} intro={prompt} action={action} onClose={onClose}>
      <View style={[styles.viewfinder, { backgroundColor: VIEWFINDER }]}>
        {complete && last ? (
          <Image
            accessibilityLabel="The photo you just took"
            source={{ uri: last }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : permission?.granted ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        ) : null}
        {!permission?.granted ? (
          <View style={styles.permission}>
            <Icon name="camera" size={26} color={Paper} />
            <ThemedText type="caption" style={styles.permissionText}>
              {permission && !permission.canAskAgain
                ? 'Camera access is off. Turn it on in Settings to take your photo.'
                : 'Allow the camera to take your photo.'}
            </ThemedText>
          </View>
        ) : !complete && shots.length === 0 && capturing ? (
          <ActivityIndicator color={Paper} />
        ) : null}
      </View>

      {count > 1 ? (
        <ScrollView
          horizontal
          style={styles.thumbRow}
          contentContainerStyle={styles.thumbs}
          showsHorizontalScrollIndicator={false}
        >
          {Array.from({ length: count }, (_, index) => {
            const uri = shots[index];
            return uri ? (
              <Pressable
                key={index}
                onPress={() => retake(index)}
                accessibilityRole="button"
                accessibilityLabel={`Take photo ${index + 1} again`}
              >
                <Image
                  accessible={false}
                  accessibilityLabel=""
                  source={{ uri }}
                  style={styles.thumb}
                  contentFit="cover"
                />
              </Pressable>
            ) : (
              <View key={index} style={[styles.thumb, styles.thumbEmpty, { borderColor: theme.outline }]}>
                <ThemedText type="captionBold" themeColor="textSecondary">
                  {index + 1}
                </ThemedText>
              </View>
            );
          })}
        </ScrollView>
      ) : null}

      {complete && !sending ? (
        <TextLink label="Retake" onPress={() => retake(count - 1)} style={styles.retake} />
      ) : null}
    </ChallengeFrame>
  );
}

const styles = StyleSheet.create({
  viewfinder: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permission: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  permissionText: {
    color: paperAlpha(0.9),
    textAlign: 'center',
  },
  thumbRow: {
    flexGrow: 0,
  },
  thumbs: {
    gap: 8,
  },
  thumb: {
    width: 56,
    height: 56,
  },
  thumbEmpty: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retake: {
    alignSelf: 'flex-start',
  },
});
