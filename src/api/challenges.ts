import { toApiError } from '@/api/errors';
import { getCurrentUserId, supabase } from '@/lib/supabase';
import type { Challenge, ChallengeCompletion } from '@/types';

/** Every challenge on an event, in owner-defined order. */
export async function getChallenges(eventId: string): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('id, event_id, type, title, description, points')
    .eq('event_id', eventId)
    .order('sort_order');
  if (error) throw toApiError(error);

  return data.map((row) => ({
    id: row.id,
    eventId: row.event_id,
    type: row.type,
    title: row.title,
    description: row.description,
    points: row.points,
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

/** Completes a challenge; the server requires a prior check-in for its event. */
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
