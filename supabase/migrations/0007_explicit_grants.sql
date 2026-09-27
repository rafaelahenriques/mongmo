-- RLS decides *which rows* a role sees; the role still needs a table-level
-- GRANT to query the table at all. Until now these migrations relied on the
-- project's `alter default privileges` handing every new public table to
-- `authenticated` — true for a classic Supabase project, but a project-level
-- setting (the Data API's "expose new tables" behaviour), not something the
-- schema controlled. Without it, every query fails with "permission denied
-- for table …" even for a signed-in user. Grant explicitly so the schema
-- works the same on any project. On a project that already had the default
-- grants this is a no-op.
--
-- `service_role` is included for admin scripts (e.g. promoting the first
-- owner, see supabase/README.md); it bypasses RLS and never ships in the
-- app. `anon` gets nothing: the app gates everything behind sign-in.

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;

-- The blanket grant above re-adds table-level SELECT on events, which would
-- undo 0006 and make qr_token readable again. Re-apply 0006 exactly
-- (revoking the table privilege also drops any column-level grants, so the
-- column list is re-granted in full).
revoke select on public.events from authenticated;
grant select (
  id, title, type, city, venue, latitude, longitude, starts_at, ends_at, time_zone,
  description, image_url, tags, capacity, occupancy, status, order_url, created_by, created_at
) on public.events to authenticated;
