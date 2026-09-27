import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { useEventQrToken } from '@/hooks/useOwnerEvent';
import { useTheme } from '@/hooks/useTheme';

export type OwnerEventQrProps = {
  eventId: string;
};

/** Owner: generates and displays the event's check-in QR code, for printing. */
export default function OwnerEventQr({ eventId }: OwnerEventQrProps) {
  const theme = useTheme();
  const [revealed, setRevealed] = useState(false);
  const query = useEventQrToken(eventId, revealed);

  if (!revealed) {
    return (
      <Pressable
        onPress={() => setRevealed(true)}
        accessibilityRole="button"
        accessibilityLabel="Show check-in QR code"
        style={[styles.button, { backgroundColor: theme.backgroundSelected }]}
      >
        <ThemedText type="smallBold">Show check-in QR code</ThemedText>
      </Pressable>
    );
  }

  if (query.isPending) {
    return <ActivityIndicator size="small" color={theme.text} />;
  }

  if (!query.data) {
    return (
      <ThemedText type="small" themeColor="danger">
        Couldn&apos;t load the QR code.
      </ThemedText>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: '#FFFFFF' }]}>
      <QRCode value={query.data} size={200} />
      <ThemedText type="small" style={styles.token}>
        {query.data}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  token: {
    color: '#666666',
  },
});
