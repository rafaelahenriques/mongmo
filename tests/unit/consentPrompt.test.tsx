import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConsentPrompt } from '@/components/privacy/ConsentPrompt';
import { useSettingsStore } from '@/state/settingsStore';

// A build with a DSN: the question is worth asking.
jest.mock('@/lib/crashReporting', () => ({ crashReportingAvailable: true }));

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const show = () =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ConsentPrompt />
    </SafeAreaProvider>,
  );

beforeEach(async () => {
  await useSettingsStore.persist.rehydrate();
  useSettingsStore.setState({ crashReports: 'unasked' });
});

it('offers no and yes as equals, and remembers no', async () => {
  await show();
  const no = screen.getByRole('button', { name: 'Don’t send' });
  const yes = screen.getByRole('button', { name: 'Send reports' });
  expect(no.props.style).toEqual(yes.props.style);

  await fireEvent.press(no);
  expect(useSettingsStore.getState().crashReports).toBe('off');
  expect(screen.queryByText('Help us fix crashes?')).toBeNull();
});

it('remembers yes', async () => {
  await show();
  await fireEvent.press(screen.getByRole('button', { name: 'Send reports' }));
  expect(useSettingsStore.getState().crashReports).toBe('on');
});

it('isn’t asked again once answered', async () => {
  useSettingsStore.setState({ crashReports: 'off' });
  await show();
  expect(screen.queryByText('Help us fix crashes?')).toBeNull();
});
