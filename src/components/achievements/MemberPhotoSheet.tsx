import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { pointsLabel, shortName } from '@/components/achievements/leaderboardText';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Radius, Spacing } from '@/constants/theme';
import type { LeaderboardRow } from '@/hooks/useLeaderboard';
import { useReportProfilePhoto } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { confirm, showError, showMessage } from '@/services/confirm';
import { haptics } from '@/services/haptics';

/**
 * Someone's photo from the leaderboard, bigger, with Report: a report hides
 * it from everyone straight away and Mongmo staff look at it (0034).
 */
export function MemberPhotoSheet({ row, onClose }: { row: LeaderboardRow | null; onClose: () => void }) {
  const theme = useTheme();
  const report = useReportProfilePhoto();
  const name = row ? shortName(row.name) : '';

  const onReport = async (member: LeaderboardRow) => {
    const yes = await confirm(
      'Report this photo?',
      'It’s hidden from the leaderboard straight away, and Mongmo staff will look at it.',
      'Report',
      { destructive: true },
    );
    if (!yes) return;
    report.mutate(member.userId, {
      onSuccess: () => {
        haptics.success();
        onClose();
        showMessage('Thanks for telling us', 'The photo is hidden while Mongmo staff look at it.');
      },
      onError: (error) => {
        haptics.error();
        showError('That didn’t work', error);
      },
    });
  };

  return (
    <Sheet
      visible={Boolean(row)}
      title={name}
      subtitle={row ? `#${row.rank} · ${pointsLabel(row.points)}` : undefined}
      onClose={onClose}
    >
      {row ? (
        <View style={styles.body}>
          <Image
            source={{ uri: row.photoUrl, cacheKey: row.photoPath || undefined }}
            style={[styles.photo, { backgroundColor: theme.backgroundSelected }]}
            contentFit="cover"
            accessibilityLabel={`${name}’s photo`}
          />
          <ThemedText type="small" themeColor="textSecondary">
            If this photo isn’t right to show here, report it. It’s hidden straight away and Mongmo staff look at it.
          </ThemedText>
          <Button
            label="Report this photo"
            variant="danger"
            icon="alert"
            loading={report.isPending}
            onPress={() => void onReport(row)}
          />
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: Spacing.three,
  },
  photo: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 1,
    alignSelf: 'center',
    borderRadius: Radius.tile,
  },
});
