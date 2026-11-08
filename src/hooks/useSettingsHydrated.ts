import { useEffect, useState } from 'react';

import { useSettingsStore } from '@/state/settingsStore';

/** Whether the saved settings have been read from the phone yet (so a saved answer isn't asked again). */
export function useSettingsHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useSettingsStore.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return undefined;
    return useSettingsStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);
  return hydrated;
}
