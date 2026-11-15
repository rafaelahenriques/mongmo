import { act, render, renderHook, screen } from '@testing-library/react-native';
import type { ComponentProps } from 'react';

import { AppHeader } from '@/components/ui/AppHeader';
import { IconNav } from '@/components/ui/IconNav';
import { useIsStaff, useOwnerView } from '@/hooks/useOwnerView';
import { useProfile } from '@/hooks/useProfile';
import { useSettingsStore } from '@/state/settingsStore';

jest.mock('@/hooks/useProfile', () => ({ useProfile: jest.fn() }));
jest.mock('@/hooks/useAchievements', () => ({ useAchievements: () => ({ summary: { points: 120 } }) }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), navigate: jest.fn() }),
  usePathname: () => '/',
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const profile = (role: 'owner' | 'customer' | undefined) =>
  jest.mocked(useProfile).mockReturnValue({ data: role ? { role } : undefined } as ReturnType<typeof useProfile>);

beforeEach(() => {
  jest.clearAllMocks();
  useSettingsStore.setState({ staff: false, customerView: false });
});

describe('who gets the owner’s view', () => {
  it('is staff, not customers', async () => {
    profile('customer');
    expect((await renderHook(() => useOwnerView())).result.current).toBe(false);
    profile('owner');
    expect((await renderHook(() => useOwnerView())).result.current).toBe(true);
  });

  it('remembers staff on this phone, so the app opens in the right view before the profile loads', async () => {
    profile('owner');
    await renderHook(() => useIsStaff());
    expect(useSettingsStore.getState().staff).toBe(true);

    profile(undefined);
    expect((await renderHook(() => useOwnerView())).result.current).toBe(true);
  });

  it('forgets it when the account turns out to be a customer’s', async () => {
    useSettingsStore.setState({ staff: true });
    profile('customer');
    const view = await renderHook(() => useOwnerView());
    expect(view.result.current).toBe(false);
    expect(useSettingsStore.getState().staff).toBe(false);
  });

  it('gives staff the customer’s view when they ask for it, and drops that with the staff flag', async () => {
    profile('owner');
    useSettingsStore.getState().setStaff(true);
    useSettingsStore.getState().setCustomerView(true);
    expect((await renderHook(() => useOwnerView())).result.current).toBe(false);

    // Signed out (the profile goes with the session): the next person starts
    // as a customer, in the customer's view.
    profile(undefined);
    await act(async () => useSettingsStore.getState().setStaff(false));
    expect(useSettingsStore.getState()).toMatchObject({ staff: false, customerView: false });
  });
});

describe('the top bar', () => {
  it('shows points and achievements to a customer', async () => {
    profile('customer');
    await render(<AppHeader title="Home" />);
    expect(screen.getByRole('button', { name: '120 points. Open Wallet.' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Achievements' })).toBeTruthy();
    expect(screen.queryByText('Owner')).toBeNull();
  });

  it('says Owner and keeps only the account button in the owner’s view', async () => {
    profile('owner');
    await render(<AppHeader title="Today" />);
    expect(screen.getByText('Owner')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Account' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Achievements' })).toBeNull();
    expect(screen.queryByRole('button', { name: /points/ })).toBeNull();
  });
});

describe('the tab bar', () => {
  const dispatch = jest.fn();
  const navigateToTab = jest.fn();
  // The tabs as the router hands them over: Pop-ups has a page open on top of its list.
  const routes = ['(home)', '(popups)', '(orders)', '(wallet)', '(profile)'].map((name) => ({
    key: `${name}-key`,
    name,
  }));
  const full = {
    routes: routes.map((route) => ({
      ...route,
      state: { key: `${route.name}-stack`, index: route.name === '(popups)' ? 1 : 0 },
    })),
  };
  const props = {
    state: { index: 4, routes },
    descriptors: Object.fromEntries(
      routes.map((route) => [route.key, { navigation: { getState: () => full, dispatch } }]),
    ),
    emitter: { emit: jest.fn(() => ({ defaultPrevented: false })) },
    navigateToTab,
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  } as unknown as ComponentProps<typeof IconNav>;
  const names = () => screen.getAllByRole('tab').map((tab) => tab.props.accessibilityLabel);

  it('is Home, Pop-ups, Order, Wallet for customers', async () => {
    profile('customer');
    await render(<IconNav {...props} />);
    expect(names()).toEqual(['Home', 'Pop-ups', 'Order', 'Wallet']);
  });

  it('is Today, Orders, Pop-ups, Menu in the owner’s view', async () => {
    profile('owner');
    await render(<IconNav {...props} />);
    expect(names()).toEqual(['Today', 'Orders', 'Pop-ups', 'Menu']);
  });

  it('starts the other view fresh when staff switch: open pages closed, first tab showing', async () => {
    profile('owner');
    await render(<IconNav {...props} />);
    expect(navigateToTab).not.toHaveBeenCalled();

    await act(async () => useSettingsStore.getState().setCustomerView(true));
    expect(names()).toEqual(['Home', 'Pop-ups', 'Order', 'Wallet']);
    // Only the tab with something open is popped back to its first screen.
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'POP_TO_TOP', target: '(popups)-stack' });
    expect(navigateToTab).toHaveBeenCalledWith('(home)-key');
  });
});
