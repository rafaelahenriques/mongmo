// Runs before every unit test file: a development build against a fake
// local Supabase. Nothing here reaches a network; the client is mocked.
process.env.EXPO_PUBLIC_APP_ENV = 'development';
process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
delete process.env.EXPO_PUBLIC_SENTRY_DSN;
