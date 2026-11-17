import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { AppState } from 'react-native';

import { getAchievements, getEarnedBadges } from '@/api/endpoints';
import { useBadgeUnlockNotifications } from '@/hooks/useBadgeUnlockNotifications';
import { notifyNow } from '@/services/notifications';

import { MilestoneHost } from '@/components/celebrate/MilestoneHost';
import { LiveStampRow } from '@/components/ui/Stamps';
import { useCelebrationStore } from '@/state/celebrationStore';
import { useSettingsStore } from '@/state/settingsStore';

jest.mock('react-native-reanimated', () => require('./reanimatedStub'));
jest.mock('@/api/endpoints', () => ({ getAchievements: jest.fn(), getEarnedBadges: jest.fn() }));
jest.mock('@/services/notifications', () => ({ notifyNow: jest.fn(async () => undefined) }));

const mockPush = jest.fn();
let mockFocused = true;
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  useIsFocused: () => mockFocused,
}));
let mockOnScreen = true;
jest.mock('@/components/ui/onScreen', () => ({
  onScreen: (_view: unknown, then: () => void) => {
    if (mockOnScreen) then();
  },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const LEVEL = {
  id: 'level:rising',
  kind: 'New level',
  title: 'Welcome to Rising',
  text: '+10% points on orders.',
  icon: 'trophy' as const,
  link: { label: 'See your level', href: '/(wallet)/levels' as const },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFocused = true;
  mockOnScreen = true;
  useCelebrationStore.setState({ queue: [], appShown: true });
  useSettingsStore.setState({ stampsSeen: null });
});

describe('the milestone queue', () => {
  it('shows each milestone once, in the order they came', () => {
    const { celebrate } = useCelebrationStore.getState();
    celebrate(LEVEL);
    celebrate({ ...LEVEL, id: 'badge:first-sip', title: 'First Sip' });
    celebrate(LEVEL);
    expect(useCelebrationStore.getState().queue.map((milestone) => milestone.id)).toEqual([
      'level:rising',
      'badge:first-sip',
    ]);
  });

  it('remembers it was seen when it closes', () => {
    const onClose = jest.fn();
    useCelebrationStore.getState().celebrate({ ...LEVEL, onClose });
    useCelebrationStore.getState().dismiss();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(useCelebrationStore.getState().queue).toEqual([]);
  });
});

describe('the milestone screen', () => {
  it('says what it is, and closes with "Nice!"', async () => {
    const onClose = jest.fn();
    await render(<MilestoneHost />);
    await act(async () => useCelebrationStore.getState().celebrate({ ...LEVEL, onClose }));
    expect(screen.getByText('New level')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Welcome to Rising' })).toBeOnTheScreen();
    expect(screen.getByText('+10% points on orders.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Nice!' }));
    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByText('Welcome to Rising')).toBeNull();
  });

  it('can go straight to it', async () => {
    await render(<MilestoneHost />);
    await act(async () => useCelebrationStore.getState().celebrate(LEVEL));
    await fireEvent.press(screen.getByText('See your level'));
    expect(mockPush).toHaveBeenCalledWith('/(wallet)/levels');
    expect(useCelebrationStore.getState().queue).toEqual([]);
  });

  it('waits for the opening animation before showing', async () => {
    useCelebrationStore.setState({ appShown: false });
    await render(<MilestoneHost />);
    await act(async () => useCelebrationStore.getState().celebrate(LEVEL));
    expect(screen.queryByText('Welcome to Rising')).toBeNull();
    await act(async () => useCelebrationStore.getState().showApp());
    expect(screen.getByText('Welcome to Rising')).toBeOnTheScreen();
  });

  it('shows the next one after the first is closed', async () => {
    await render(<MilestoneHost />);
    await act(async () => {
      useCelebrationStore.getState().celebrate(LEVEL);
      useCelebrationStore
        .getState()
        .celebrate({ ...LEVEL, id: 'badge:first-sip', kind: 'New badge', title: 'First Sip' });
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByText('First Sip')).toBeOnTheScreen();
  });
});

describe('stamps landing', () => {
  it('lands the stamps earned since the card was last on screen, once', async () => {
    useSettingsStore.setState({ stampsSeen: 1 });
    await render(<LiveStampRow earned={3} total={6} />);
    expect(useSettingsStore.getState().stampsSeen).toBe(3);
  });

  it('just remembers the count the first time, or after a reward is spent', async () => {
    await render(<LiveStampRow earned={2} total={6} />);
    expect(useSettingsStore.getState().stampsSeen).toBe(2);

    useSettingsStore.setState({ stampsSeen: 5 });
    await render(<LiveStampRow earned={1} total={6} />);
    expect(useSettingsStore.getState().stampsSeen).toBe(1);
  });

  it('waits until the card is scrolled into view', async () => {
    mockOnScreen = false;
    useSettingsStore.setState({ stampsSeen: 1 });
    await render(<LiveStampRow earned={3} total={6} />);
    expect(useSettingsStore.getState().stampsSeen).toBe(1);
  });

  it('waits for the opening animation to finish', async () => {
    useCelebrationStore.setState({ appShown: false });
    useSettingsStore.setState({ stampsSeen: 1 });
    await render(<LiveStampRow earned={3} total={6} />);
    expect(useSettingsStore.getState().stampsSeen).toBe(1);
  });

  it('waits while a new level or badge covers the screen', async () => {
    useCelebrationStore.getState().celebrate(LEVEL);
    useSettingsStore.setState({ stampsSeen: 1 });
    await render(<LiveStampRow earned={3} total={6} />);
    expect(useSettingsStore.getState().stampsSeen).toBe(1);
  });

  it('waits until the card is showing', async () => {
    mockFocused = false;
    useSettingsStore.setState({ stampsSeen: 1 });
    await render(<LiveStampRow earned={3} total={6} />);
    expect(useSettingsStore.getState().stampsSeen).toBe(1);
  });
});

describe('a new badge', () => {
  const FIRST_SIP = {
    id: 'b1',
    key: 'first_check_in',
    title: 'First Sip',
    description: 'Check in to your first pop-up',
  };

  let client: QueryClient;
  let unmount: () => void;

  afterEach(() => {
    unmount();
    client.clear();
  });

  async function earn(appState: 'active' | 'background') {
    Object.defineProperty(AppState, 'currentState', { value: appState, configurable: true });
    jest.mocked(getAchievements).mockResolvedValue({ badges: [FIRST_SIP] } as never);
    jest.mocked(getEarnedBadges).mockResolvedValue([] as never);
    client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    ({ unmount } = await renderHook(() => useBadgeUnlockNotifications(), { wrapper }));
    await waitFor(() => expect(client.getQueryData(['badges', 'earned'])).toEqual([]));
    await waitFor(() => expect(client.getQueryData(['achievements'])).toBeDefined());
    // Let the hook take its first look (nothing earned yet) before the badge comes.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    // The server awards it; the list is fetched again.
    jest.mocked(getEarnedBadges).mockResolvedValue([{ badgeId: 'b1' }] as never);
    await act(async () => client.invalidateQueries({ queryKey: ['badges', 'earned'] }));
  }

  it('is celebrated on the whole screen while the app is open', async () => {
    await earn('active');
    await waitFor(() => expect(useCelebrationStore.getState().queue).toHaveLength(1));
    expect(useCelebrationStore.getState().queue[0]).toMatchObject({ kind: 'New badge', title: 'First Sip' });
    expect(notifyNow).not.toHaveBeenCalled();
  });

  it('is a notification while the app is in the background', async () => {
    await earn('background');
    await waitFor(() =>
      expect(notifyNow).toHaveBeenCalledWith(expect.objectContaining({ title: 'Badge unlocked: First Sip' })),
    );
    expect(useCelebrationStore.getState().queue).toEqual([]);
  });
});
