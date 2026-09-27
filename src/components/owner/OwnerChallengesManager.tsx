import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Spacing } from '@/constants/theme';
import { useOwnerChallenges } from '@/hooks/useOwnerChallenges';
import { useTheme } from '@/hooks/useTheme';
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

export type OwnerChallengesManagerProps = {
  eventId: string;
};

/** Owner: add/edit/remove challenges for one event, from the fixed type list. */
export default function OwnerChallengesManager({ eventId }: OwnerChallengesManagerProps) {
  const theme = useTheme();
  const { challenges, create, remove } = useOwnerChallenges(eventId);
  const [type, setType] = useState<ChallengeType>('taste');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('20');

  const onAdd = () => {
    const pointsValue = Number(points);
    if (!title.trim() || Number.isNaN(pointsValue) || pointsValue < 0) return;
    create({ type, title: title.trim(), description: description.trim(), points: pointsValue });
    setTitle('');
    setDescription('');
    setPoints('20');
  };

  const onRemove = (challenge: Challenge) => {
    Alert.alert('Remove challenge?', challenge.title, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove(challenge.id) },
    ]);
  };

  return (
    <View style={styles.container}>
      {challenges.map((challenge) => (
        <View
          key={challenge.id}
          style={[styles.row, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
        >
          <View style={styles.rowTexts}>
            <ThemedText type="smallBold">
              {challenge.title} · {challenge.type}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
              {challenge.description} · +{challenge.points} pts
            </ThemedText>
          </View>
          <Pressable
            onPress={() => onRemove(challenge)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${challenge.title}`}
            hitSlop={8}
          >
            <Trash2 size={18} color={theme.danger} />
          </Pressable>
        </View>
      ))}

      <ThemedText type="label" style={styles.addTitle}>
        Add a challenge
      </ThemedText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
        {CHALLENGE_TYPES.map((option) => {
          const selected = option === type;
          return (
            <Pressable
              key={option}
              onPress={() => setType(option)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={option.replace('_', ' ')}
              style={[
                styles.typeChip,
                { backgroundColor: selected ? theme.highlight : theme.backgroundElement, borderColor: theme.border },
              ]}
            >
              <ThemedText type="label" style={{ color: selected ? theme.onHighlight : theme.text }}>
                {option.replace('_', ' ')}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Challenge title"
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
      />
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Challenge description"
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
      />
      <TextInput
        value={points}
        onChangeText={setPoints}
        placeholder="Points"
        keyboardType="numeric"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Challenge points"
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
      />

      <Button label="Add challenge" variant="secondary" onPress={onAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    borderWidth: 2,
    padding: Spacing.two,
  },
  rowTexts: {
    flex: 1,
    gap: 2,
  },
  addTitle: {
    marginTop: Spacing.two,
  },
  typeRow: {
    flexGrow: 0,
  },
  typeChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
    borderWidth: 2,
    marginRight: Spacing.one,
  },
  input: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: Spacing.three,
  },
});
