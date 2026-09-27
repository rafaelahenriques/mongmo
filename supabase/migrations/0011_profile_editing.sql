-- Let people edit their own display name, bio and home city — and nothing
-- else on their profile row.
--
-- 1. Limits the app shows in its form are enforced here too. Existing rows
--    are brought within them first so the constraints can be added.
-- 2. Until now `authenticated` could UPDATE every column of its own row
--    (RLS picks the row, not the columns), including `member_since`. The
--    role is already guarded by prevent_role_escalation; narrow the grant to
--    the columns a person may actually change.
-- Idempotent.

update public.profiles set name = left(btrim(name), 40) where name <> left(btrim(name), 40);
update public.profiles set name = 'Mongmo fan' where name = '';
update public.profiles set bio = left(btrim(bio), 160) where bio <> left(btrim(bio), 160);
update public.profiles
  set home_city = nullif(left(btrim(home_city), 60), '')
  where home_city is distinct from nullif(left(btrim(home_city), 60), '');

alter table public.profiles drop constraint if exists profiles_name_length;
alter table public.profiles add constraint profiles_name_length
  check (name = btrim(name) and char_length(name) between 1 and 40);

alter table public.profiles drop constraint if exists profiles_bio_length;
alter table public.profiles add constraint profiles_bio_length
  check (bio = btrim(bio) and char_length(bio) <= 160);

alter table public.profiles drop constraint if exists profiles_home_city_length;
alter table public.profiles add constraint profiles_home_city_length
  check (home_city is null or (home_city = btrim(home_city) and char_length(home_city) between 1 and 60));

-- Revoking the table privilege drops any column grants too, so this
-- re-states the full list every time it runs.
revoke update on public.profiles from authenticated;
grant update (name, bio, home_city, avatar_url, leaderboard_visible) on public.profiles to authenticated;

-- Sign-up derives the first name from the email; keep it within the limit.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url, home_city)
  values (
    new.id,
    coalesce(
      nullif(left(btrim(new.raw_user_meta_data ->> 'name'), 40), ''),
      nullif(left(btrim(split_part(new.email, '@', 1)), 40), ''),
      'Mongmo fan'
    ),
    new.raw_user_meta_data ->> 'avatar_url',
    nullif(left(btrim(new.raw_user_meta_data ->> 'home_city'), 60), '')
  );
  return new;
end;
$$;
