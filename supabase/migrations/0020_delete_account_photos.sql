-- Deleting an account deletes the photos too.
--
-- delete_my_account() (0016) removes the login, and with it, by cascade,
-- the profile and everything that hangs off it: check-ins, challenge
-- completions, photo records, badges, points and rewards (orders it
-- deletes itself; their lines cascade). The photo *files* live in Storage
-- (challenge-photos/<user id>/...), which a row delete can't reach: the
-- app removes them through the Storage API first. So that it can, people
-- may delete files in their own folder; and so a half-done deletion can't
-- slip through, delete_my_account() refuses while any are left.

drop policy if exists "challenge photos delete own folder" on storage.objects;
create policy "challenge photos delete own folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'challenge-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

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

  if exists (
    select 1 from storage.objects
    where bucket_id = 'challenge-photos' and (storage.foldername(name))[1] = v_user::text
  ) then
    raise exception 'Your photos are still being deleted. Try again.';
  end if;

  update public.events set created_by = null where created_by = v_user;
  delete from public.orders where user_id = v_user;
  -- Cascades: profiles → check_ins, challenge_completions, photos,
  -- user_badges, point_events, user_rewards; orders → order_items.
  delete from auth.users where id = v_user;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
