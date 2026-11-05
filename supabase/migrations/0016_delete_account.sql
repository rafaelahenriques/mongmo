-- Delete account (App Store guideline 5.1.1(v)): the signed-in user
-- removes themselves from Settings. Their orders go too (order lines
-- cascade); pop-ups an owner created stay, without a creator. Everything
-- else hangs off the profile, which cascades from auth.users.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Not signed in';
  end if;

  update public.events set created_by = null where created_by = v_user;
  delete from public.orders where user_id = v_user;
  delete from auth.users where id = v_user;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
