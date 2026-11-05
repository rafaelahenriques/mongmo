// Integration tests talk to a real Supabase: Postgres with every migration
// and the seed applied, GoTrue for accounts and PostgREST for the API. They
// must never touch a hosted project, so anything but a local URL is refused.
const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  throw new Error(
    `Integration tests need ${missing.join(', ')} for a local Supabase. ` +
      'Start one with `supabase start` and see tests/README.md.',
  );
}
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(process.env.SUPABASE_URL!)) {
  throw new Error(`SUPABASE_URL is ${process.env.SUPABASE_URL}: integration tests only run against a local Supabase.`);
}

jest.setTimeout(30_000);
