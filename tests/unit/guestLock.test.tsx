import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { GuestGate } from '@/components/guest/GuestGate';
import { JOIN } from '@/components/guest/joinCopy';
import { GuestContext } from '@/hooks/useIsGuest';
import { supabase } from '@/lib/supabase';
import { clearWelcomeMode, welcomeMode } from '@/services/guest';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, canGoBack: () => true, replace: jest.fn() }),
  usePathname: () => '/wallet',
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/lib/supabase', () => ({ supabase: { auth: { signOut: jest.fn(async () => ({ error: null })) } } }));

const wallet = (guest: boolean) =>
  render(
    <GuestContext.Provider value={guest}>
      <GuestGate copy={JOIN.wallet}>
        <Text>Your points</Text>
      </GuestGate>
    </GuestContext.Provider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  clearWelcomeMode();
});

it('shows a member the screen as it is', async () => {
  await wallet(false);
  expect(screen.getByText('Your points')).toBeOnTheScreen();
  expect(screen.queryByText('Create an account')).toBeNull();
});

it('shows a guest the screen dimmed, out of reach, under a card to make an account', async () => {
  await wallet(true);
  expect(screen.getByText(JOIN.wallet.title)).toBeOnTheScreen();
  // Still there to see, but not to a screen reader (or a tap).
  expect(screen.getByText('Your points', { includeHiddenElements: true })).toBeTruthy();
  expect(screen.queryByText('Your points')).toBeNull();
});

it.each([
  ['Create an account', 'sign-up'],
  ['Sign in', 'sign-in'],
] as const)('"%s" ends the guest session and opens Welcome on that form', async (button, mode) => {
  await wallet(true);
  await fireEvent.press(screen.getByText(button));
  expect(supabase.auth.signOut).toHaveBeenCalled();
  expect(welcomeMode()).toBe(mode);
});

it('has a way back from a screen opened on top of another', async () => {
  await wallet(true);
  await fireEvent.press(screen.getByText('Go back'));
  expect(mockBack).toHaveBeenCalled();
});
