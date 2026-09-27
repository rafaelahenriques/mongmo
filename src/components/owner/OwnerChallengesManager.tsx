import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { CHALLENGE_TYPES } from '@/components/challenges/challengeTypes';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { Spacing } from '@/constants/theme';
import { useOwnerChallenges } from '@/hooks/useOwnerChallenges';
import { useTheme } from '@/hooks/useTheme';
import { challengeRequirement } from '@/utils/challengeConfig';

export type OwnerChallengesManagerProps = {
  eventId: string;
  timeZone: string;
};

/** Owner: this pop-up's challenges — tap one to edit it, or add another. */
export default function OwnerChallengesManager({ eventId, timeZone }: OwnerChallengesManagerProps) {
  const theme = useTheme();
  const router = useRouter();
  const { challenges } = useOwnerChallenges(eventId);

  return (
    <View style={styles.container}>
      {challenges.length > 0 ? (
        <Card style={styles.list}>
          {challenges.map((challenge, index) => {
            const requirement = challengeRequirement(challenge, timeZone);
            return (
              <View key={challenge.id}>
                {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
                <ListRow
                  title={challenge.title}
                  subtitle={[CHALLENGE_TYPES[challenge.type].label, `+${challenge.points} pts`, requirement]
                    .filter(Boolean)
                    .join(' · ')}
                  icon={CHALLENGE_TYPES[challenge.type].icon}
                  onPress={() =>
                    router.push({
                      pathname: '/(profile)/owner/challenge/[id]',
                      params: { id: challenge.id, eventId },
                    })
                  }
                  accessibilityLabel={`Edit ${challenge.title}`}
                />
              </View>
            );
          })}
        </Card>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          No challenges yet. Add one to give people something to do (and points to earn).
        </ThemedText>
      )}

      <Button
        label="Add a challenge"
        variant="primary"
        icon="add"
        onPress={() => router.push({ pathname: '/(profile)/owner/challenge/new', params: { eventId } })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  list: {
    paddingVertical: Spacing.two,
    gap: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 40 + Spacing.three,
  },
});
