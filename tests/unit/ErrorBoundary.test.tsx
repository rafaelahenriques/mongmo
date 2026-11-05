import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';

let shouldThrow = true;
function Flaky() {
  if (shouldThrow) throw new Error('could not load order for a@b.co');
  return <Text>All good</Text>;
}

beforeEach(() => {
  shouldThrow = true;
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

it('shows a retry card instead of a crash, and logs the error without personal data', async () => {
  await render(
    <ErrorBoundary>
      <Flaky />
    </ErrorBoundary>,
  );
  expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
  expect(console.error).toHaveBeenCalledWith(
    '[render] Unhandled render error',
    'Error: could not load order for [email]',
  );
});

it('renders the screen again on "Try again"', async () => {
  await render(
    <ErrorBoundary>
      <Flaky />
    </ErrorBoundary>,
  );
  shouldThrow = false;
  await fireEvent.press(screen.getByLabelText('Dismiss the error and try again'));
  expect(screen.getByText('All good')).toBeOnTheScreen();
});
