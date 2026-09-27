-- Every signed-in read of "my profile" assumes a profiles row exists, which
-- 0002's on_auth_user_created trigger guarantees — but only for accounts
-- created after that trigger existed. An account made earlier (from the
-- dashboard, or while an earlier `db push` was still failing) has no row,
-- and the Profile tab can't load. Backfill those once, with the same
-- defaults the trigger uses; a no-op when nothing is missing.
insert into public.profiles (id, name, avatar_url, home_city)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1), ''),
  u.raw_user_meta_data ->> 'avatar_url',
  u.raw_user_meta_data ->> 'home_city'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
