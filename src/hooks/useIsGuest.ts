import { createContext, useContext } from 'react';

/**
 * Whether the signed-in account is a guest's ("Continue as guest", an
 * anonymous sign-in). Set once from the session (Providers), so screens
 * know at their first frame, without waiting for a request.
 */
export const GuestContext = createContext(false);

/**
 * True for a guest. Guests look around (Home, pop-ups, the menu); ordering,
 * checking in, the Wallet, achievements and the profile need an account,
 * and show locked (GuestLock). The database refuses them too (0042).
 */
export function useIsGuest(): boolean {
  return useContext(GuestContext);
}
