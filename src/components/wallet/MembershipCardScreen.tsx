import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import QRCode from 'react-native-qrcode-svg';
import { formatInTimeZone } from 'date-fns-tz';

import { shortName } from '@/components/achievements/LeaderboardList';
import { Wordmark } from '@/components/brand/Wordmark';
import { ThemedText } from '@/components/ThemedText';
import { StampRow } from '@/components/ui/Stamps';
import { BrandPhotoFocus, BrandPhotos } from '@/constants/brandPhotos';
import { Ink, PageInset, Paper } from '@/constants/theme';
import { useAchievements } from '@/hooks/useAchievements';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useProfile } from '@/hooks/useProfile';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { DISPLAY_TIME_ZONE } from '@/utils/dateTime';
import { STAMP_VALUE_LABEL, stampCard, stampsLabel } from '@/utils/stamps';

/**
 * M-05 Membership card: a sage card like the one in a wallet, with the
 * wordmark and the bánh mì, your QR code big on paper (ink on paper in any
 * theme, so every scanner reads it), your name, points and since when;
 * then your stamp card. The code is your account's id, so it shows even
 * before your profile loads.
 */
export default function MembershipCardScreen() {
  const theme = useTheme();
  const tabBarInset = useTabBarInset();
  const profile = useProfile();
  const account = useAuthUser();
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
  const userId = profile.data?.id ?? account.data?.id ?? null;
  const name = profile.data?.name || account.data?.email?.split('@')[0] || '';
  const since = profile.data?.memberSince
    ? formatInTimeZone(new Date(profile.data.memberSince), DISPLAY_TIME_ZONE, 'MMM yyyy')
    : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 32 }]}
    >
      <View style={[styles.card, { backgroundColor: theme.brandFill }]}>
        <View style={styles.cardTop}>
          <Wordmark height={26} color={Ink} />
          {BrandPhotos.card ? (
            <Image
              source={BrandPhotos.card}
              style={styles.photo}
              contentFit="cover"
              contentPosition={BrandPhotoFocus.card}
              accessibilityIgnoresInvertColors
            />
          ) : null}
        </View>

        <View
          style={styles.qr}
          accessible
          accessibilityRole="image"
          accessibilityLabel="Your membership QR code. Show it at the counter."
        >
          {userId ? (
            <QRCode value={`mongmo://member/${userId}`} size={200} color={Ink} backgroundColor={Paper} />
          ) : null}
        </View>

        <View style={styles.cardRow}>
          <View style={styles.flex}>
            <ThemedText type="section" numberOfLines={1} style={{ color: Ink }}>
              {name ? shortName(name) : ' '}
            </ThemedText>
            {since ? (
              <ThemedText type="small" style={{ color: Ink }}>
                {`Member since ${since}`}
              </ThemedText>
            ) : null}
          </View>
          <View style={styles.points}>
            <ThemedText type="section" style={{ color: Ink }}>
              {points}
            </ThemedText>
            <ThemedText type="small" style={{ color: Ink }}>
              points
            </ThemedText>
          </View>
        </View>
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        Show this at the counter or at a pop-up to collect your points.
      </ThemedText>

      <View style={styles.stamps}>
        <View style={styles.stampsHead}>
          <ThemedText type="subtitle" accessibilityRole="header" style={styles.flex}>
            Your stamp card
          </ThemedText>
          <ThemedText type="smallBold">{STAMP_VALUE_LABEL}</ThemedText>
        </View>
        <StampRow earned={stamps.earned} total={stamps.total} partial={stamps.partial} />
        <ThemedText type="small" themeColor="textSecondary">
          {nextReward
            ? `${stamps.earned} of ${stampsLabel(stamps.total)}. ${nextReward.costPoints - points} more points to: ${nextReward.title}.`
            : 'Card full: redeem a reward in Wallet.'}
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: PageInset,
    paddingTop: 8,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    gap: 18,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  qr: {
    alignSelf: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: Paper,
    minWidth: 228,
    minHeight: 228,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  points: {
    alignItems: 'flex-end',
  },
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  stamps: {
    gap: 12,
    marginTop: 8,
  },
  stampsHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
});
