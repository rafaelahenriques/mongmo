import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Radius, Spacing } from '@/constants/theme';
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
      <Button
        label="Show check-in QR code"
        variant="primary"
        icon="qrcode"
        onPress={() => setRevealed(true)}
      />
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
    // Always black on white, whatever the theme: that's what scanners read best.
    <View style={[styles.card, { boxShadow: `0px 10px 28px ${theme.shadow}` }]}>
      <QRCode value={query.data} size={220} />
      <ThemedText type="label" style={styles.token}>
        Scan to check in
      </ThemedText>
      <ThemedText type="small" style={styles.token} selectable>
        {query.data}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.large,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  token: {
    color: '#342626',
  },
});
