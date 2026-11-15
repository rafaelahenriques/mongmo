-- Guests look around; members take part.
--
-- A guest ("Continue as guest", an anonymous sign-in) can see Home, the
-- pop-ups and the menu. Everything that keeps something for a person needs
-- an account: ordering, checking in, challenges and their photos, rewards,
-- reporting a photo, and changing the profile. The app shows those locked;
-- this makes the database refuse them too, whatever app version or request
-- asks. Guest accounts are one tap to make, so they can't be what takes a
-- photo down (a report does that at once) or what fills the kitchen with
-- orders.
--
-- Checked with triggers on the rows themselves, so the functions that write
-- them (create_order, verify_check_in, complete_challenge, redeem_reward,
-- report_photo, ...) need no change. Inside those security definer
-- functions auth.jwt() is still the caller's token. The service role
-- (Edge Functions, the nightly retention job) isn't a guest.

create or replace function public.is_guest()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;

revoke execute on function public.is_guest() from public, anon;
grant execute on function public.is_guest() to authenticated;

-- Before a guest's row goes in (or a guest's profile changes): refuse.
create or replace function public.refuse_guests()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_guest() then
    raise exception 'Make an account to do this.' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Fired by the database, never called.
revoke execute on function public.refuse_guests() from public, anon, authenticated;

drop trigger if exists orders_refuse_guests on public.orders;
create trigger orders_refuse_guests
  before insert on public.orders
  for each row execute function public.refuse_guests();

drop trigger if exists check_ins_refuse_guests on public.check_ins;
create trigger check_ins_refuse_guests
  before insert on public.check_ins
  for each row execute function public.refuse_guests();

drop trigger if exists challenge_completions_refuse_guests on public.challenge_completions;
create trigger challenge_completions_refuse_guests
  before insert on public.challenge_completions
  for each row execute function public.refuse_guests();

drop trigger if exists photos_refuse_guests on public.photos;
create trigger photos_refuse_guests
  before insert on public.photos
  for each row execute function public.refuse_guests();

drop trigger if exists user_rewards_refuse_guests on public.user_rewards;
create trigger user_rewards_refuse_guests
  before insert on public.user_rewards
  for each row execute function public.refuse_guests();

drop trigger if exists photo_reports_refuse_guests on public.photo_reports;
create trigger photo_reports_refuse_guests
  before insert on public.photo_reports
  for each row execute function public.refuse_guests();

drop trigger if exists profile_photo_reports_refuse_guests on public.profile_photo_reports;
create trigger profile_photo_reports_refuse_guests
  before insert on public.profile_photo_reports
  for each row execute function public.refuse_guests();

-- The profile is made for a guest too (ensure_profile, on sign-in); it's
-- changing it (name, city, photo, the leaderboard) that needs an account.
drop trigger if exists profiles_refuse_guests on public.profiles;
create trigger profiles_refuse_guests
  before update on public.profiles
  for each row execute function public.refuse_guests();

-- Nor can a guest upload a file: no challenge photos, no profile photo.
-- Restrictive, so it applies on top of each bucket's own rules; reading
-- (the photos of the week, pop-up pictures) stays as it is.
drop policy if exists "guests upload nothing" on storage.objects;
create policy "guests upload nothing" on storage.objects
  as restrictive
  for insert to authenticated
  with check (not public.is_guest());

drop policy if exists "guests change no files" on storage.objects;
create policy "guests change no files" on storage.objects
  as restrictive
  for update to authenticated
  using (not public.is_guest());
