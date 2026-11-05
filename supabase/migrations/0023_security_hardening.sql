-- Security hardening, from the security audit (docs/security-audit.md).
--
-- 1. Functions: nothing runs for a visitor who isn't signed in. Postgres
--    lets everyone (PUBLIC, so also `anon`) execute a new function unless
--    told otherwise, so a visitor holding only the public anon key could
--    call the leaderboard (members' names) or try the order and reward
--    functions. Now only signed-in users (guests included) can, and only
--    the functions the app calls. Trigger functions run as triggers only.
-- 2. Challenge photos: the bucket was public, so anyone with a photo's
--    link could open it without signing in. It's private now; the app
--    shows photos through short-lived signed links. The `url` column,
--    which held a link the app itself wrote (and so could have pointed
--    anywhere), is gone: the storage path is the only reference.
-- 3. Input limits: lengths and formats on every text a person can type,
--    checked by the database whatever the app sends. NOT VALID: they apply
--    to new and changed rows, never failing on old data.

-- ------------------------------------------------------------------
-- 1. Who may run each function
-- ------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
alter default privileges in schema public revoke execute on functions from public, anon;

-- What the app calls, and the helpers its security rules and checks use.
grant execute on function public.advance_order_status(uuid, text) to authenticated;
grant execute on function public.complete_challenge(uuid, jsonb) to authenticated;
grant execute on function public.confirm_mock_payment(uuid) to authenticated;
grant execute on function public.create_order(uuid, uuid, jsonb, timestamptz, uuid) to authenticated;
grant execute on function public.delete_my_account() to authenticated;
grant execute on function public.ensure_profile() to authenticated;
grant execute on function public.get_event_qr_token(uuid) to authenticated;
grant execute on function public.leaderboard(text) to authenticated;
grant execute on function public.my_badge_progress() to authenticated;
grant execute on function public.my_loyalty() to authenticated;
grant execute on function public.my_points_balance() to authenticated;
grant execute on function public.my_stats() to authenticated;
grant execute on function public.redeem_reward(uuid) to authenticated;
grant execute on function public.verify_check_in(uuid, text, double precision, double precision) to authenticated;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.challenge_config_int(jsonb, text, integer, integer, integer, text) to authenticated;
grant execute on function public.challenge_config_text(jsonb, text, integer, text) to authenticated;
grant execute on function public.normalize_challenge_config(text, jsonb, timestamptz, timestamptz) to authenticated;
grant execute on function public.distance_m(double precision, double precision, double precision, double precision) to authenticated;

-- Trigger functions: fired by the database, never called.
revoke execute on function public.award_badge_points() from authenticated;
revoke execute on function public.award_challenge_points() from authenticated;
revoke execute on function public.award_order_points() from authenticated;
revoke execute on function public.bump_occupancy_on_check_in() from authenticated;
revoke execute on function public.challenges_normalize_config() from authenticated;
revoke execute on function public.events_add_photo_challenge() from authenticated;
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.orders_require_running_event() from authenticated;
revoke execute on function public.prevent_role_escalation() from authenticated;

-- Helpers that didn't pin their search path: pin it, so a schema earlier
-- on the path can't stand in for a table or function they use.
alter function public.challenge_config_int(jsonb, text, integer, integer, integer, text) set search_path = public;
alter function public.challenge_config_text(jsonb, text, integer, text) set search_path = public;
alter function public.normalize_challenge_config(text, jsonb, timestamptz, timestamptz) set search_path = public;
alter function public.distance_m(double precision, double precision, double precision, double precision) set search_path = public;

-- ------------------------------------------------------------------
-- 2. Challenge photos: private bucket, no stored links
-- ------------------------------------------------------------------
update storage.buckets set public = false where id = 'challenge-photos';
alter table public.photos drop column if exists url;

-- ------------------------------------------------------------------
-- 3. Input limits
-- ------------------------------------------------------------------
-- An https link, at most 500 characters, or nothing.
alter table public.profiles drop constraint if exists profiles_avatar_url_check;
alter table public.profiles add constraint profiles_avatar_url_check
  check (avatar_url is null or (avatar_url ~ '^https://' and char_length(avatar_url) <= 500)) not valid;

alter table public.photos drop constraint if exists photos_storage_path_check;
alter table public.photos add constraint photos_storage_path_check
  check (char_length(storage_path) <= 300 and storage_path !~ '\.\.') not valid;

alter table public.events drop constraint if exists events_text_limits_check;
alter table public.events add constraint events_text_limits_check
  check (
    char_length(btrim(title)) between 1 and 80
    and char_length(coalesce(description, '')) <= 2000
    and char_length(coalesce(city, '')) <= 60
    and char_length(coalesce(venue, '')) <= 120
    and (image_url is null or image_url = '' or (image_url ~ '^https://' and char_length(image_url) <= 500))
    and (order_url is null or order_url = '' or (order_url ~ '^https://' and char_length(order_url) <= 500))
  ) not valid;

alter table public.menu_items drop constraint if exists menu_items_text_limits_check;
alter table public.menu_items add constraint menu_items_text_limits_check
  check (
    char_length(btrim(name)) between 1 and 80
    and char_length(coalesce(description, '')) <= 300
    and char_length(coalesce(category, '')) <= 60
    and price_cents <= 100000
    and (image_url is null or image_url = '' or (image_url ~ '^https://' and char_length(image_url) <= 500))
  ) not valid;

alter table public.menus drop constraint if exists menus_text_limits_check;
alter table public.menus add constraint menus_text_limits_check
  check (char_length(btrim(name)) between 1 and 80 and char_length(coalesce(description, '')) <= 300) not valid;
