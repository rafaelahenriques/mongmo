import { Alert } from 'react-native';

import { confirm, errorMessage, showError } from '@/services/confirm';

afterEach(() => jest.restoreAllMocks());

/** Presses the dialog's button with this label, or dismisses it. */
function answer(label: string | 'dismiss') {
  jest.spyOn(Alert, 'alert').mockImplementationOnce((_title, _message, buttons, options) => {
    if (label === 'dismiss') options?.onDismiss?.();
    else buttons?.find((button) => button.text === label)?.onPress?.();
  });
}

describe('confirm', () => {
  it('resolves true when they confirm, false when they cancel or dismiss', async () => {
    answer('Delete');
    await expect(confirm('Delete?', 'Gone for good.', 'Delete')).resolves.toBe(true);
    answer('Cancel');
    await expect(confirm('Delete?', 'Gone for good.', 'Delete')).resolves.toBe(false);
    answer('dismiss');
    await expect(confirm('Delete?', 'Gone for good.', 'Delete')).resolves.toBe(false);
  });

  it('marks destructive actions, and takes its own cancel label', async () => {
    answer('Keep it');
    await confirm('Delete this challenge?', '…', 'Delete', { cancelLabel: 'Keep it', destructive: true });
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    expect(buttons).toEqual([
      expect.objectContaining({ text: 'Keep it', style: 'cancel' }),
      expect.objectContaining({ text: 'Delete', style: 'destructive' }),
    ]);
  });
});

describe('errors', () => {
  it("says the error's message, or the fallback", () => {
    expect(errorMessage(new Error('Not enough points'))).toBe('Not enough points');
    expect(errorMessage('weird', 'Check your connection.')).toBe('Check your connection.');
    expect(errorMessage(new Error(''))).toBe('Please try again.');
  });

  it('shows it in an alert', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    showError('Couldn’t redeem it', new Error('Not enough points'));
    expect(alert).toHaveBeenCalledWith('Couldn’t redeem it', 'Not enough points');
  });
});
