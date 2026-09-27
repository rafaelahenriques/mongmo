import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { CHALLENGE_ICON } from '@/components/challenges/challengeIcons';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { ListRow } from '@/components/ui/ListRow';
import { OptionPill } from '@/components/ui/OptionPill';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { useOwnerChallenges } from '@/hooks/useOwnerChallenges';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import type { Challenge } from '@/types';
import type { ChallengeType } from '@/types/database';

const CHALLENGE_TYPES: ChallengeType[] = [
  'explore',
  'check_in',
  'capture',
  'taste',
  'social',
  'timing',
  'collection',
  'discovery',
  'streak',
  'community',
];

const typeLabel = (type: ChallengeType) => type.replace('_', ' ');

export type OwnerChallengesManagerProps = {
  eventId: string;
};

/** Owner: add/remove challenges for one event, from the fixed type list. */
export default function OwnerChallengesManager({ eventId }: OwnerChallengesManagerProps) {
  const theme = useTheme();
  const { challenges, create, remove } = useOwnerChallenges(eventId);
  const [type, setType] = useState<ChallengeType>('taste');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('20');

  const onAdd = () => {
    const pointsValue = Number(points);
    if (!title.trim() || Number.isNaN(pointsValue) || pointsValue < 0) {
      haptics.error();
      return;
    }
    create({ type, title: title.trim(), description: description.trim(), points: pointsValue });
    haptics.success();
    setTitle('');
    setDescription('');
    setPoints('20');
  };

  const onRemove = (challenge: Challenge) => {
    haptics.warning();
    Alert.alert('Remove challenge?', challenge.title, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove(challenge.id) },
    ]);
  };

  return (
    <View style={styles.container}>
      {challenges.length > 0 ? (
        <Card style={styles.list}>
          {challenges.map((challenge, index) => (
            <View key={challenge.id}>
              {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
              <ListRow
                title={challenge.title}
                subtitle={`${typeLabel(challenge.type)} · +${challenge.points} pts`}
                icon={CHALLENGE_ICON[challenge.type]}
                trailing={
                  <IconButton
                    icon="trash"
                    tone="muted"
                    size={34}
                    onPress={() => onRemove(challenge)}
                    accessibilityLabel={`Remove ${challenge.title}`}
                  />
                }
              />
            </View>
          ))}
        </Card>
      ) : null}

      <Card style={styles.form}>
        <ThemedText type="section">Add a challenge</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
          {CHALLENGE_TYPES.map((option) => (
            <OptionPill
              key={option}
              label={typeLabel(option)}
              icon={CHALLENGE_ICON[option]}
              checked={option === type}
              onPress={() => setType(option)}
            />
          ))}
        </ScrollView>
        <TextField label="Challenge title" value={title} onChangeText={setTitle} placeholder="Rate the bánh mì" />
        <TextField
          label="Challenge description"
          value={description}
          onChangeText={setDescription}
          placeholder="What should people do?"
        />
        <TextField label="Challenge points" value={points} onChangeText={setPoints} keyboardType="numeric" />
        <Button label="Add challenge" variant="primary" icon="add" onPress={onAdd} haptic="none" />
      </Card>
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
  form: {
    gap: Spacing.three,
  },
  typeRow: {
    gap: Spacing.two,
  },
});
