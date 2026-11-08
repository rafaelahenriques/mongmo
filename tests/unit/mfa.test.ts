import { supabase } from '@/lib/supabase';
import { enrollAuthenticator, listSecondFactors, needsSecondStep, verifyCode } from '@/services/mfa';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: jest.fn(),
        enroll: jest.fn(),
        challenge: jest.fn(),
        verify: jest.fn(),
        getAuthenticatorAssuranceLevel: jest.fn(),
        unenroll: jest.fn(),
      },
    },
  },
}));
const mfa = jest.mocked(supabase.auth.mfa);

it('lists authenticator apps and whether each is confirmed', async () => {
  mfa.listFactors.mockResolvedValue({
    data: { totp: [{ id: 'f1', friendly_name: 'Phone', status: 'verified' }], all: [], phone: [] },
    error: null,
  } as never);
  await expect(listSecondFactors()).resolves.toEqual([{ id: 'f1', type: 'totp', name: 'Phone', verified: true }]);
});

it('starts adding an authenticator app with a QR code and secret', async () => {
  mfa.enroll.mockResolvedValue({
    data: { id: 'f2', totp: { qr_code: '<svg/>', secret: 'ABC' } },
    error: null,
  } as never);
  await expect(enrollAuthenticator()).resolves.toEqual({ factorId: 'f2', qrCodeSvg: '<svg/>', secret: 'ABC' });
});

it('checks a code through a fresh challenge', async () => {
  mfa.challenge.mockResolvedValue({ data: { id: 'c1' }, error: null } as never);
  mfa.verify.mockResolvedValue({ data: {}, error: null } as never);
  await expect(verifyCode('f1', ' 123456 ')).resolves.toBe(true);
  expect(mfa.verify).toHaveBeenCalledWith({ factorId: 'f1', challengeId: 'c1', code: '123456' });
});

it('asks for the second step only when the account has one and it was not used yet', async () => {
  mfa.getAuthenticatorAssuranceLevel.mockResolvedValueOnce({
    data: { currentLevel: 'aal1', nextLevel: 'aal2' },
    error: null,
  } as never);
  await expect(needsSecondStep()).resolves.toBe(true);
  mfa.getAuthenticatorAssuranceLevel.mockResolvedValueOnce({
    data: { currentLevel: 'aal1', nextLevel: 'aal1' },
    error: null,
  } as never);
  await expect(needsSecondStep()).resolves.toBe(false);
});
