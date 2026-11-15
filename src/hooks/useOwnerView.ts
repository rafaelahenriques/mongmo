import { useEffect } from 'react';

import { useProfile } from '@/hooks/useProfile';
import { useSettingsStore } from '@/state/settingsStore';

/**
 * Whether the signed-in person is Mongmo staff. Until the profile has
 * loaded it's what this phone saw last time, so the app opens in the right
 * view at once. (What staff may do is decided by the server, not by this.)
 */
export function useIsStaff(): boolean {
  const role = useProfile().data?.role;
  const remembered = useSettingsStore((state) => state.staff);
  const setStaff = useSettingsStore((state) => state.setStaff);

  useEffect(() => {
    if (role && (role === 'owner') !== remembered) setStaff(role === 'owner');
  }, [role, remembered, setStaff]);

  return role ? role === 'owner' : remembered;
}

/**
 * The owner's view of the app: its tabs are Today, Orders, Pop-ups and
 * Menu instead of the customer's. Staff get it unless they've switched to
 * the customer's view (Account → Customer view).
 */
export function useOwnerView(): boolean {
  const staff = useIsStaff();
  const customerView = useSettingsStore((state) => state.customerView);
  return staff && !customerView;
}
