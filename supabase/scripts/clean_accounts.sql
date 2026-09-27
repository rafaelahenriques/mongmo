-- A clean slate for a demo or a submission. Deletes every account, except
-- the ones you list below, with everything it made:
--   check-ins, challenge completions, points, badges, rewards, orders,
--   and the pop-ups it created (the demo pop-ups from seed.sql stay).
-- It also deletes every challenge-photo record.
--
-- Run it in this order (there's no undo):
--   1. Dashboard → Storage → challenge-photos → "..." → Empty bucket.
--      Supabase deletes stored files only through its Storage API, never
--      from SQL, so the pictures themselves go here.
--   2. SQL Editor → New query → paste this whole file → Run.
--   3. Re-run seed.sql, which resets the demo pop-ups (dates, challenges,
--      how busy they are).

begin;

-- The accounts to delete: all of them, except the emails in this list.
-- To keep one (e.g. your own owner account), write it in lower case:
--   array['you@example.com']::text[]
create temporary table removed_users on commit drop as
select id
from auth.users
where coalesce(lower(email), '') <> all (array[]::text[]);

-- Pop-ups those accounts created. The demo pop-ups have no creator.
create temporary table removed_events on commit drop as
select id
from public.events
where created_by in (select id from removed_users);

-- Orders don't go with their account or pop-up, so they go first (their
-- line items go with them).
delete from public.orders
where user_id in (select id from removed_users)
   or event_id in (select id from removed_events);

-- The pop-ups, with their challenges, check-ins, completions and photos.
delete from public.events
where id in (select id from removed_events);

-- Every photo record: the bucket they point into was emptied in step 1.
delete from public.photos;

-- The accounts. Their profiles, check-ins, completions, points, badges
-- and rewards go with them.
delete from auth.users
where id in (select id from removed_users);

commit;

-- What's left.
select
  (select count(*) from auth.users) as accounts,
  (select count(*) from public.events) as pop_ups,
  (select count(*) from public.orders) as orders,
  (select count(*) from public.check_ins) as check_ins,
  (select count(*) from public.photos) as photos;
