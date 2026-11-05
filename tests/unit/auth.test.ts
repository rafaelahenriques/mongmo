import { Alert } from 'react-native';

import { supabase } from '@/lib/supabase';
import { changePassword, confirmDeleteAccount } from '@/services/auth';

const mockBucket = { list: jest.fn(), remove: jest.fn() };
jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    auth: { getUser: jest.fn(), signOut: jest.fn(), signInWithPassword: jest.fn(), updateUser: jest.fn() },
    storage: { from: jest.fn(() => mockBucket) },
  },
}));
const auth = jest.mocked(supabase.auth);
const rpc = supabase.rpc as unknown as jest.Mock;

const USER = { id: 'user-1', email: 'customer@example.com' };

/** Answers the next confirmation dialog by pressing the button with this label. */
function answerDialog(label: string) {
  jest.spyOn(Alert, 'alert').mockImplementationOnce((_title, _message, buttons) => {
    buttons?.find((button) => button.text === label)?.onPress?.();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  auth.getUser.mockResolvedValue({ data: { user: USER }, error: null } as never);
  rpc.mockResolvedValue({ data: null, error: null });
});

describe('deleting the account', () => {
  it('does nothing when they cancel', async () => {
    answerDialog('Cancel');
    await confirmDeleteAccount();
    expect(rpc).not.toHaveBeenCalled();
    expect(mockBucket.list).not.toHaveBeenCalled();
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it('deletes every photo file, then the account and its data, then signs out', async () => {
    answerDialog('Delete');
    mockBucket.list
      .mockResolvedValueOnce({ data: [{ name: 'a.jpg' }, { name: 'b.jpg' }], error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    mockBucket.remove.mockResolvedValue({ error: null });

    await confirmDeleteAccount();

    expect(supabase.storage.from).toHaveBeenCalledWith('challenge-photos');
    expect(mockBucket.list).toHaveBeenCalledWith('user-1', { limit: 100 });
    expect(mockBucket.remove).toHaveBeenCalledWith(['user-1/a.jpg', 'user-1/b.jpg']);
    expect(rpc).toHaveBeenCalledWith('delete_my_account');
    expect(auth.signOut).toHaveBeenCalled();
  });

  it("stops and says so when the photos can't be deleted", async () => {
    answerDialog('Delete');
    mockBucket.list.mockResolvedValueOnce({ data: null, error: new Error('Storage is down') });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

    await confirmDeleteAccount();

    expect(alert).toHaveBeenCalledWith('Couldn’t delete your photos', 'Storage is down');
    expect(rpc).not.toHaveBeenCalled();
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it("stays signed in and says so when the server can't delete the account", async () => {
    answerDialog('Delete');
    mockBucket.list.mockResolvedValueOnce({ data: [], error: null });
    rpc.mockResolvedValue({ data: null, error: { message: 'Your photos are still being deleted. Try again.' } });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

    await confirmDeleteAccount();

    expect(alert).toHaveBeenCalledWith(
      'Couldn’t delete your account',
      'Your photos are still being deleted. Try again.',
    );
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});

describe('changing the password', () => {
  it('needs an account with an email', async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: 'guest' } }, error: null } as never);
    await expect(changePassword('old', 'new-password')).resolves.toMatch(/guest account has no password/);
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('checks the current password first', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials', status: 400 } } as never);
    await expect(changePassword('wrong', 'new-password')).resolves.toBe('That isn’t your current password.');
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: USER.email, password: 'wrong' });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it('passes on other sign-in problems as they are', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { status: 429, message: 'Too many requests' } } as never);
    await expect(changePassword('old', 'new-password')).resolves.toBe('Too many requests');
  });

  it('says when the new password is the old one', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null } as never);
    auth.updateUser.mockResolvedValue({ error: { code: 'same_password', message: '' } } as never);
    await expect(changePassword('old', 'old')).resolves.toBe('Your new password is the same as the old one.');
  });

  it('changes it and reports no problem', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null } as never);
    auth.updateUser.mockResolvedValue({ error: null } as never);
    await expect(changePassword('old', 'new-password')).resolves.toBeNull();
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'new-password' });
  });
});
