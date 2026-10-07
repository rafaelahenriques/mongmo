import { useEffect, useState } from 'react';

import { suggestPlaces, type PlaceSuggestion } from '@/services/placeSearch';
import type { Coordinates } from '@/types';

/** Fewer letters match half the country. */
const MIN_QUERY_LENGTH = 3;
/** Wait for a pause in typing instead of asking on every keystroke. */
const DEBOUNCE_MS = 300;

type Result = { query: string; suggestions: PlaceSuggestion[]; failed: boolean };

/**
 * Address suggestions for `query` as it's typed. A newer query cancels the
 * request in flight, and an answer is only shown for the query it belongs
 * to, so a slow reply can never replace a newer one.
 */
export function usePlaceSuggestions(query: string, near: Coordinates) {
  const [result, setResult] = useState<Result | null>(null);
  const trimmed = query.trim();
  const { latitude, longitude } = near;

  useEffect(() => {
    if (trimmed.length < MIN_QUERY_LENGTH) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      suggestPlaces(trimmed, { latitude, longitude }, controller.signal)
        .then((suggestions) => setResult({ query: trimmed, suggestions, failed: false }))
        .catch(() => {
          if (!controller.signal.aborted) setResult({ query: trimmed, suggestions: [], failed: true });
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, latitude, longitude]);

  const searching = trimmed.length >= MIN_QUERY_LENGTH;
  const current = searching && result?.query === trimmed ? result : null;
  return {
    suggestions: current?.suggestions ?? [],
    loading: searching && current === null,
    failed: current?.failed ?? false,
  };
}
