import { authErrorMessage } from '@/services/authMessages';

beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => undefined));
afterEach(() => jest.restoreAllMocks());

it('explains the problems people can fix', () => {
  expect(authErrorMessage({ code: 'invalid_credentials' })).toBe('That email and password don’t match.');
  expect(authErrorMessage({ code: 'user_already_exists' })).toMatch(/Sign in instead/);
  expect(authErrorMessage({ code: 'weak_password' })).toMatch(/at least 8 characters/);
});

it('says to wait when sign-in is rate limited', () => {
  expect(authErrorMessage({ code: 'over_request_rate_limit' })).toMatch(/Too many tries/);
  expect(authErrorMessage({ status: 429 })).toMatch(/Too many tries/);
});

it('hides the server’s own wording for anything else, and logs it', () => {
  expect(authErrorMessage({ code: 'unexpected_failure', message: 'Database error saving new user' })).toBe(
    'That didn’t work. Check your connection and try again.',
  );
  expect(console.warn).toHaveBeenCalledWith('[auth] failed (unexpected_failure): Database error saving new user');
});
