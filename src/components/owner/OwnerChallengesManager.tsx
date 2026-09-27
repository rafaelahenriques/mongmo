import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';

import { ThemedText } from '@/components/ThemedText';
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
          style={[styles.row, { borderColor: theme.backgroundSelected, backgroundColor: theme.backgroundElement }]}
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

      <ThemedText type="smallBold" style={styles.addTitle}>
        Add a challenge
      </ThemedText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
        {CHALLENGE_TYPES.map((option) => {
          const selected = option === type;
          return (
            <Pressable
              key={option}
              onPress={() => setType(option)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={option}
              style={[
                styles.typeChip,
                { backgroundColor: selected ? theme.text : theme.backgroundElement },
              ]}
            >
              <ThemedText type="small" style={{ color: selected ? theme.background : theme.text }}>
                {option}
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
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
      />
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Challenge description"
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
      />
      <TextInput
        value={points}
        onChangeText={setPoints}
        placeholder="Points"
        keyboardType="numeric"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Challenge points"
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
      />

      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel="Add challenge"
        style={({ pressed }) => [styles.addButton, { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.8 : 1 }]}
      >
        <ThemedText type="smallBold">Add challenge</ThemedText>
      </Pressable>
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
    borderWidth: StyleSheet.hairlineWidth,
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
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 999,
    marginRight: Spacing.one,
  },
  input: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
  },
  addButton: {
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
