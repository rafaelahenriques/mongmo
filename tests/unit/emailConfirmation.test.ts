import { supabase } from '@/lib/supabase';
import { alreadyRegistered, confirmWithCode, resendConfirmation } from '@/services/emailConfirmation';

jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { verifyOtp: jest.fn(), resend: jest.fn() } },
}));
const auth = jest.mocked(supabase.auth);

beforeEach(() => jest.clearAllMocks());

describe('signing up with an address that already has an account', () => {
  it('is recognised by the user Supabase hands back: one without identities', () => {
    expect(alreadyRegistered({ identities: [] })).toBe(true);
  });

  it('is not confused with a new account, or with no user at all', () => {
    expect(alreadyRegistered({ identities: [{ provider: 'email' }] })).toBe(false);
    expect(alreadyRegistered({ identities: null })).toBe(false);
    expect(alreadyRegistered({})).toBe(false);
    expect(alreadyRegistered(null)).toBe(false);
  });
});

describe('confirming with the code', () => {
  it('asks for six digits before calling the server', async () => {
    await expect(confirmWithCode('someone@example.com', '12 34')).resolves.toBe(
      'Enter the 6-digit code from the email.',
    );
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });

  it('checks it as a sign-up code for that address', async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: null } as never);
    await expect(confirmWithCode(' someone@example.com ', ' 123456 ')).resolves.toBeNull();
    expect(auth.verifyOtp).toHaveBeenCalledWith({ email: 'someone@example.com', token: '123456', type: 'signup' });
  });

  it('says a wrong or old code is wrong or expired', async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: { status: 403, code: 'otp_expired' } } as never);
    await expect(confirmWithCode('someone@example.com', '123456')).resolves.toBe(
      'That code is wrong or has expired. Ask for a new one.',
    );
  });
});

describe('sending the code again', () => {
  it('asks Supabase for another sign-up email', async () => {
    auth.resend.mockResolvedValue({ data: {}, error: null } as never);
    await expect(resendConfirmation(' someone@example.com ')).resolves.toBeNull();
    expect(auth.resend).toHaveBeenCalledWith({ type: 'signup', email: 'someone@example.com' });
  });

  it('says to wait when the emails are rate limited', async () => {
    auth.resend.mockResolvedValue({ data: {}, error: { status: 429, code: 'over_email_send_rate_limit' } } as never);
    await expect(resendConfirmation('someone@example.com')).resolves.toBe(
      'Too many emails sent. Wait a few minutes, then try again.',
    );
  });
});
