import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { CHALLENGE_TYPE_ORDER, CHALLENGE_TYPES } from '@/components/challenges/challengeTypes';
import { ChallengeRulesFields } from '@/components/owner/ChallengeRulesFields';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { OptionPill } from '@/components/ui/OptionPill';
import { SectionHeader } from '@/components/ui/Screen';
import { Stepper } from '@/components/ui/Stepper';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { useOwnerChallenges } from '@/hooks/useOwnerChallenges';
import { useOwnerEvent } from '@/hooks/useOwnerEvent';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/services/haptics';
import type { Challenge, ChallengeRules } from '@/types';
import {
  CHALLENGE_LIMITS,
  challengeRulesProblem,
  defaultChallengeRules,
  parseChallengeRules,
} from '@/utils/challengeConfig';

export type OwnerChallengeEditorScreenProps = {
  eventId: string;
  /** Omit to create a new challenge. */
  challengeId?: string;
};

const POINTS = { min: 0, max: 500, step: 5 };

/** Owner: create or edit one challenge — its type, the type's settings, title and points. */
export default function OwnerChallengeEditorScreen({ eventId, challengeId }: OwnerChallengeEditorScreenProps) {
  const theme = useTheme();
  const eventQuery = useOwnerEvent(eventId);
  const { challenges, isLoading } = useOwnerChallenges(eventId);
  const existing = challengeId ? challenges.find((challenge) => challenge.id === challengeId) : undefined;

  if (eventQuery.isPending || isLoading) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  if (!eventQuery.data || (challengeId && !existing)) {
    return (
      <View style={[styles.state, { backgroundColor: theme.background }]}>
        <IconBadge name="alert" size={48} />
        <ThemedText type="section">{challengeId ? 'Challenge not found' : 'Pop-up not found'}</ThemedText>
      </View>
    );
  }

  return (
    <ChallengeForm
      eventId={eventId}
      event={{
        startsAt: eventQuery.data.starts_at,
        endsAt: eventQuery.data.ends_at,
        timeZone: eventQuery.data.time_zone,
      }}
      existing={existing}
    />
  );
}

function ChallengeForm({
  eventId,
  event,
  existing,
}: {
  eventId: string;
  event: { startsAt: string; endsAt: string; timeZone: string };
  existing?: Challenge;
}) {
  const theme = useTheme();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const { create, update, remove } = useOwnerChallenges(eventId);

  const [rules, setRules] = useState<ChallengeRules>(() =>
    existing ? parseChallengeRules(existing.type, existing.config, event) : defaultChallengeRules('taste', event),
  );
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [points, setPoints] = useState(existing?.points ?? 20);
  const [problem, setProblem] = useState<string | null>(null);

  const saving = create.isPending || update.isPending;
  const serverError = (existing ? update.error : create.error)?.message ?? null;

  const onPickType = (type: ChallengeRules['type']) => {
    if (type === rules.type) return;
    setProblem(null);
    setRules(defaultChallengeRules(type, event));
  };

  const onSave = () => {
    const issue = !title.trim() ? 'Give the challenge a title.' : challengeRulesProblem(rules);
    setProblem(issue);
    if (issue) {
      haptics.error();
      return;
    }
    const input = { title, description, points, rules };
    const done = {
      onSuccess: () => {
        haptics.success();
        router.back();
      },
      onError: () => haptics.error(),
    };
    if (existing) update.mutate({ challengeId: existing.id, input }, done);
    else create.mutate(input, done);
  };

  const onDelete = () => {
    if (!existing) return;
    haptics.warning();
    Alert.alert('Delete this challenge?', 'People who already completed it keep their points.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove.mutate(existing.id, { onSuccess: () => router.back() }),
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + Spacing.five }]}
        keyboardShouldPersistTaps="handled"
      >
        <SectionHeader title="Type" />
        <View style={styles.types} accessibilityRole="radiogroup" accessibilityLabel="Challenge type">
          {CHALLENGE_TYPE_ORDER.map((type) => (
            <OptionPill
              key={type}
              label={CHALLENGE_TYPES[type].label}
              icon={CHALLENGE_TYPES[type].icon}
              checked={rules.type === type}
              onPress={() => onPickType(type)}
            />
          ))}
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {CHALLENGE_TYPES[rules.type].hint}
        </ThemedText>

        <Card style={styles.group}>
          <ThemedText type="section">Settings</ThemedText>
          <ChallengeRulesFields rules={rules} onChange={setRules} timeZone={event.timeZone} />
        </Card>

        <Card style={styles.group}>
          <ThemedText type="section">Details</ThemedText>
          <TextField
            label="Challenge title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Rate the bánh mì"
            maxLength={CHALLENGE_LIMITS.titleLength}
          />
          <TextField
            label="Challenge description"
            value={description}
            onChangeText={setDescription}
            placeholder="What should people do?"
            multiline
            maxLength={CHALLENGE_LIMITS.descriptionLength}
          />
          <View style={styles.pointsRow}>
            <ThemedText type="smallBold" style={styles.flex}>
              Points
            </ThemedText>
            <Stepper
              value={points}
              onChange={setPoints}
              min={POINTS.min}
              max={POINTS.max}
              step={POINTS.step}
              label="points"
            />
          </View>
        </Card>

        {problem ?? serverError ? (
          <ThemedText type="smallBold" themeColor="danger" accessibilityRole="alert">
            {problem ?? serverError}
          </ThemedText>
        ) : null}

        <Button
          label={existing ? 'Save challenge' : 'Add challenge'}
          variant="brand"
          icon="check"
          haptic="press"
          loading={saving}
          onPress={onSave}
        />
        {existing ? (
          <Button
            label="Delete challenge"
            variant="danger"
            icon="trash"
            loading={remove.isPending}
            onPress={onDelete}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  content: {
    padding: Spacing.three + Spacing.one,
    gap: Spacing.three,
  },
  types: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  group: {
    gap: Spacing.three,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
