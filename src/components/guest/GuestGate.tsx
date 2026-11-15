import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { GuestLock } from '@/components/guest/GuestLock';
import type { JoinCopy } from '@/components/guest/joinCopy';
import { useIsGuest } from '@/hooks/useIsGuest';
import { useTheme } from '@/hooks/useTheme';

type GuestGateProps = PropsWithChildren<{
  copy: JoinCopy;
  /**
   * Show the screen itself, dimmed, under the lock. Off for screens that
   * would do something on opening (the camera, a cart's checks) or have
   * nothing to show a guest.
   */
  preview?: boolean;
}>;

/**
 * A screen that needs an account: as it is for members; for a guest,
 * locked (GuestLock) with a way back, however they got there (a button,
 * a link, a notification).
 */
export function GuestGate({ copy, preview = true, children }: GuestGateProps) {
  const guest = useIsGuest();
  const router = useRouter();
  const theme = useTheme();
  if (!guest) return children;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(home)'));
  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <GuestLock {...copy} onBack={back}>
        {preview ? children : <View style={styles.screen} />}
      </GuestLock>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
