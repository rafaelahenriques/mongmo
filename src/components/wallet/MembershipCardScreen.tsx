import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import QRCode from 'react-native-qrcode-svg';

import { Wordmark } from '@/components/brand/Wordmark';
import { ThemedText } from '@/components/ThemedText';
import { StampRow } from '@/components/ui/Stamps';
import { BrandPhotoFocus, BrandPhotos } from '@/constants/brandPhotos';
import { Ink, PageInset, Paper } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useProfile } from '@/hooks/useProfile';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { STAMP_VALUE_LABEL, stampCard } from '@/utils/stamps';

/**
 * M-05 Membership card: the wordmark, your name and points, and your QR
 * code for the counter, then your stamp card. The code is always ink on
 * paper, whatever the theme, so any scanner reads it.
 */
export default function MembershipCardScreen() {
  const theme = useTheme();
  const tabBarInset = useTabBarInset();
  const profile = useProfile();
  const { query, summary } = useAchievements();
  const points = summary.points;

  const nextReward = useMemo(
    () =>
      [...(query.data?.rewards ?? [])]
        .sort((a, b) => a.costPoints - b.costPoints)
        .find((reward) => reward.costPoints > points),
    [query.data?.rewards, points],
  );
  const stamps = stampCard(points, nextReward);
  const userId = profile.data?.id;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 32 }]}
    >
      <View style={[styles.card, { backgroundColor: theme.backgroundSelected }]}>
        <View style={styles.cardTop}>
          <Wordmark height={22} />
        </View>
        {BrandPhotos.card ? (
          <Image
            source={BrandPhotos.card}
            style={styles.photo}
            contentFit="cover"
            contentPosition={BrandPhotoFocus.card}
            accessibilityIgnoresInvertColors
          />
        ) : null}
        <View style={styles.cardRow}>
          <ThemedText type="section" numberOfLines={1} style={styles.flex}>
            {profile.data?.name ?? ''}
          </ThemedText>
          <ThemedText type="section">{points} points</ThemedText>
        </View>
        <View
          style={styles.qr}
          accessible
          accessibilityRole="image"
          accessibilityLabel="Your membership QR code. Show it at the counter."
        >
          {userId ? (
            <QRCode value={`mongmo://member/${userId}`} size={168} color={Ink} backgroundColor={Paper} />
          ) : null}
        </View>
      </View>
      <ThemedText type="caption" themeColor="textSecondary">
        Show this at the counter or at a pop-up to collect your points.
      </ThemedText>

      <View style={styles.stamps}>
        <View style={styles.stampsHead}>
          <ThemedText type="subtitle" accessibilityRole="header" style={styles.flex}>
            Your stamp card
          </ThemedText>
          <ThemedText type="captionBold">{STAMP_VALUE_LABEL}</ThemedText>
        </View>
        <StampRow earned={stamps.earned} total={stamps.total} partial={stamps.partial} height={44} />
        <ThemedText type="caption" themeColor="textSecondary">
          {nextReward
            ? `${stamps.earned} of ${stamps.total} stamps. ${nextReward.costPoints - points} more points to: ${nextReward.title}.`
            : 'Card full: redeem a reward in Wallet.'}
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PageInset,
    paddingTop: 4,
    gap: 14,
  },
  card: {
    paddingBottom: 18,
  },
  cardTop: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  photo: {
    height: 120,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 12,
  },
  flex: {
    flex: 1,
  },
  qr: {
    alignSelf: 'center',
    padding: 10,
    backgroundColor: Paper,
  },
  stamps: {
    gap: 10,
    marginTop: 12,
  },
  stampsHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
});
