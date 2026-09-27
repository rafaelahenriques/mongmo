-- The app draws every badge with a system symbol chosen by the badge's
-- stable `key` (see src/components/achievements/badgeIcons.ts), so the
-- emoji column is no longer read anywhere. Idempotent.
alter table public.badges drop column if exists emoji;
