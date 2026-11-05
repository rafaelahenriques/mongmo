import { supabase } from '@/lib/supabase';
import { resetWithCode, sendResetCode } from '@/services/passwordReset';

jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { resetPasswordForEmail: jest.fn(), verifyOtp: jest.fn(), updateUser: jest.fn() } },
}));
const auth = jest.mocked(supabase.auth);

beforeEach(() => jest.clearAllMocks());

describe('sending a reset code', () => {
  it('checks the email first', async () => {
    await expect(sendResetCode('not-an-email')).resolves.toBe('That email address doesn’t look right.');
    expect(auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('answers the same whether or not the account exists', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { status: 400, message: 'User not found' },
    } as never);
    await expect(sendResetCode(' someone@example.com ')).resolves.toBeNull();
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('someone@example.com');
  });

  it('says to wait when the emails are rate limited', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { status: 429, code: 'over_email_send_rate_limit' },
    } as never);
    await expect(sendResetCode('someone@example.com')).resolves.toMatch(/Too many emails/);
  });
});

describe('resetting with the code', () => {
  it('wants a 6-digit code and a long enough password', async () => {
    await expect(resetWithCode('a@b.co', '12ab', 'long-enough-1')).resolves.toMatch(/6-digit code/);
    await expect(resetWithCode('a@b.co', '123456', 'short')).resolves.toMatch(/at least 8 characters/);
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });

  it('says when the code is wrong or expired, and changes nothing', async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: { status: 403, code: 'otp_expired' } } as never);
    await expect(resetWithCode('a@b.co', '123456', 'long-enough-1')).resolves.toMatch(/wrong or has expired/);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it('checks the code, then sets the new password', async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: null } as never);
    auth.updateUser.mockResolvedValue({ data: {}, error: null } as never);
    await expect(resetWithCode(' a@b.co ', ' 123456 ', 'long-enough-1')).resolves.toBeNull();
    expect(auth.verifyOtp).toHaveBeenCalledWith({ email: 'a@b.co', token: '123456', type: 'recovery' });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'long-enough-1' });
  });
});
