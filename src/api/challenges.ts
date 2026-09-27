import { toApiError } from '@/api/errors';
import { getCurrentUserId, supabase } from '@/lib/supabase';
import type { Challenge, ChallengeCompletion } from '@/types';
import { parseChallengeRules } from '@/utils/challengeConfig';

/** Every challenge on an event, in owner-defined order. */
export async function getChallenges(eventId: string): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('id, event_id, type, title, description, points, config')
    .eq('event_id', eventId)
    .order('sort_order')
    .order('created_at');
  if (error) throw toApiError(error);

  return data.map((row) => ({
    id: row.id,
    eventId: row.event_id,
    title: row.title,
    description: row.description,
    points: row.points,
    ...parseChallengeRules(row.type, row.config),
  }));
}

/** All of the signed-in user's challenge completions. */
export async function getMyChallengeCompletions(): Promise<ChallengeCompletion[]> {
  // Scoped explicitly: RLS also lets an owner read every customer's completions.
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('challenge_completions')
    .select('challenge_id, completed_at, data')
    .eq('user_id', userId);
  if (error) throw toApiError(error);

  return data.map((row) => ({
    challengeId: row.challenge_id,
    completedAt: row.completed_at,
    data: row.data,
  }));
}

/**
 * Completes a challenge. The server requires a prior check-in for its event
 * and then checks the type's own rule (photos uploaded, inside the time
 * window, a valid vote…); its message says what's missing.
 */
export async function completeChallenge(
  challengeId: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabase.rpc('complete_challenge', {
    p_challenge_id: challengeId,
    p_data: data,
  });
  if (error) throw toApiError(error);
}
