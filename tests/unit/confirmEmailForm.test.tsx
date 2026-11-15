import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ConfirmEmailForm } from '@/components/auth/ConfirmEmailForm';
import { confirmWithCode, resendConfirmation } from '@/services/emailConfirmation';

jest.mock('@/services/emailConfirmation', () => ({
  confirmWithCode: jest.fn(),
  resendConfirmation: jest.fn(),
}));

const EMAIL = 'someone@example.com';
const show = (onBack = jest.fn()) => render(<ConfirmEmailForm email={EMAIL} onBack={onBack} />);

beforeEach(() => jest.clearAllMocks());

it('says where the code went and checks what is typed for that address', async () => {
  jest.mocked(confirmWithCode).mockResolvedValue(null);
  await show();
  expect(screen.getByText(`We’ve emailed a 6-digit code to ${EMAIL}. Enter it here to finish.`)).toBeTruthy();

  await fireEvent.changeText(screen.getByLabelText('Code from the email'), '482913');
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm' }));

  await waitFor(() => expect(confirmWithCode).toHaveBeenCalledWith(EMAIL, '482913'));
  expect(screen.queryByRole('alert')).toBeNull();
});

it('shows what was wrong with the code', async () => {
  jest.mocked(confirmWithCode).mockResolvedValue('That code is wrong or has expired. Ask for a new one.');
  await show();
  await fireEvent.changeText(screen.getByLabelText('Code from the email'), '000000');
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm' }));

  expect(await screen.findByText('That code is wrong or has expired. Ask for a new one.')).toBeTruthy();
});

it('sends another code and says the old one is no good', async () => {
  jest.mocked(resendConfirmation).mockResolvedValue(null);
  await show();
  await fireEvent.press(screen.getByRole('button', { name: 'Send the code again' }));

  await waitFor(() => expect(resendConfirmation).toHaveBeenCalledWith(EMAIL));
  expect(await screen.findByText(`We’ve sent a new code to ${EMAIL}. The older one no longer works.`)).toBeTruthy();
});

it('goes back to signing in', async () => {
  const onBack = jest.fn();
  await show(onBack);
  await fireEvent.press(screen.getByRole('button', { name: 'Back to sign in' }));
  expect(onBack).toHaveBeenCalled();
});
