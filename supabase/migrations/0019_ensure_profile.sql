-- A signed-in account without a profile can't order, check in or earn
-- points: every one of those rows points at public.profiles. Sign-up makes
-- the profile (handle_new_user), but an account can still end up without
-- one (made before that trigger, or its profile removed by hand). The app
-- calls this when it can't find the profile, and before placing an order.

create or replace function public.ensure_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user auth.users%rowtype;
begin
  select * into v_user from auth.users where id = auth.uid();
  if not found then
    raise exception 'This account no longer exists. Sign in again.' using errcode = 'P0002';
  end if;

  insert into public.profiles (id, name)
  values (
    v_user.id,
    coalesce(
      nullif(left(btrim(v_user.raw_user_meta_data ->> 'name'), 40), ''),
      nullif(left(btrim(split_part(v_user.email, '@', 1)), 40), ''),
      'Mongmo fan'
    )
  )
  on conflict (id) do nothing;
end;
$$;

grant execute on function public.ensure_profile() to authenticated;
