import { fireEvent, render, screen } from '@testing-library/react-native';

import SignInScreen from '@/components/auth/SignInScreen';
import { supabase } from '@/lib/supabase';
import { clearWelcomeMode, startAccount } from '@/services/guest';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInAnonymously: jest.fn(async () => ({ error: null })),
      signOut: jest.fn(async () => ({ error: null })),
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  clearWelcomeMode();
});

it('opens on the landing: create an account, sign in, or skip', async () => {
  await render(<SignInScreen />);
  expect(screen.getByRole('button', { name: 'Create an account' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Sign in' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: /^Skip/ })).toBeOnTheScreen();
});

it('goes to the short form, switches between the two, and back to the landing', async () => {
  await render(<SignInScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Create an account' }));
  expect(screen.getByText('Join Mongmo')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Create account' })).toBeOnTheScreen();

  // The other form is the link at the top right.
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  expect(screen.getByText('Welcome back')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Forgot your password?' })).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByRole('button', { name: /^Skip/ })).toBeOnTheScreen();
});

it('skips to look around as a guest', async () => {
  await render(<SignInScreen />);
  await fireEvent.press(screen.getByRole('button', { name: /^Skip/ }));
  expect(supabase.auth.signInAnonymously).toHaveBeenCalled();
});

it('opens straight on the form a guest asked for', async () => {
  await startAccount('sign-up');
  await render(<SignInScreen />);
  expect(screen.getByText('Join Mongmo')).toBeOnTheScreen();
});
