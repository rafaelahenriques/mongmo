import { useEffect, useState } from 'react';

/**
 * The current time, refreshed every `intervalMs` — so a screen that shows
 * "live" or "opens at…" flips on its own when a pop-up starts or ends.
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
