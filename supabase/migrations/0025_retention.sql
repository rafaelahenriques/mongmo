-- Data retention: what's kept, for how long, and the code that deletes it.
-- The schedule (also in docs/privacy/retention.md and the privacy policy):
--
--   Unpaid draft orders                      1 day
--   Guest accounts not used                  30 days
--   Challenge photos (files and records)     12 months after they were taken
--   Check-ins and challenge results          24 months
--   Orders and their lines                   24 months
--   Rewards already used                     24 months after they were used
--   Accounts not used                        24 months, then deleted entirely
--   Points history                           as long as the account (it is the balance)
--
-- "Used" means signed in, or kept signed in (a session refreshed), or an
-- order or check-in.
--
-- Photo files live in Storage, which SQL can't delete properly, so it runs
-- in two steps (scripts/retention.mjs, daily from .github/workflows/
-- retention.yml): retention_photo_paths() lists the files due, the script
-- deletes them through the Storage API, then apply_retention() deletes the
-- rows, and accounts whose files are gone. Both run as the service role
-- only: nobody signed in to the app can call them.

-- When an account was last used.
create or replace function public.last_active_at(p_user uuid)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    u.created_at,
    u.last_sign_in_at,
    (select max(coalesce(s.refreshed_at::timestamptz, s.updated_at)) from auth.sessions s where s.user_id = u.id),
    (select max(o.created_at) from public.orders o where o.user_id = u.id),
    (select max(c.checked_in_at) from public.check_ins c where c.user_id = u.id)
  )
  from auth.users u
  where u.id = p_user;
$$;

-- Accounts due for deletion: guests unused for 30 days, others for 24 months.
create or replace function public.retention_expired_accounts(p_now timestamptz default now())
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.id
  from auth.users u
  where public.last_active_at(u.id) < p_now - case when coalesce(u.is_anonymous, false) then interval '30 days' else interval '24 months' end
    and not exists (select 1 from public.profiles p where p.id = u.id and p.role = 'owner');
$$;

-- Photo files to delete: older than 12 months, or belonging to an account due for deletion.
create or replace function public.retention_photo_paths(p_now timestamptz default now())
returns table (path text)
language sql
stable
security definer
set search_path = public
as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'challenge-photos'
    and (
      o.created_at < p_now - interval '12 months'
      or (storage.foldername(o.name))[1] in (select id::text from public.retention_expired_accounts(p_now))
    );
$$;

-- Deletes everything past its retention period. Returns how much of each.
create or replace function public.apply_retention(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_drafts integer;
  v_orders integer;
  v_photos integer;
  v_check_ins integer;
  v_completions integer;
  v_rewards integer;
  v_accounts integer;
begin
  delete from public.orders where status = 'draft' and created_at < p_now - interval '1 day';
  get diagnostics v_drafts = row_count;

  delete from public.orders where created_at < p_now - interval '24 months';
  get diagnostics v_orders = row_count;

  -- Only rows whose file is already gone (the script deletes files first).
  delete from public.photos p
  where p.created_at < p_now - interval '12 months'
    and not exists (
      select 1 from storage.objects o where o.bucket_id = 'challenge-photos' and o.name = p.storage_path
    );
  get diagnostics v_photos = row_count;

  delete from public.check_ins where checked_in_at < p_now - interval '24 months';
  get diagnostics v_check_ins = row_count;

  delete from public.challenge_completions where completed_at < p_now - interval '24 months';
  get diagnostics v_completions = row_count;

  delete from public.user_rewards where used_at is not null and used_at < p_now - interval '24 months';
  get diagnostics v_rewards = row_count;

  -- Whole accounts, the same way delete_my_account() does it, once their
  -- photo files are gone.
  with expired as (
    select a.id
    from public.retention_expired_accounts(p_now) as a(id)
    where not exists (
      select 1 from storage.objects o
      where o.bucket_id = 'challenge-photos' and (storage.foldername(o.name))[1] = a.id::text
    )
  ),
  unlinked as (
    update public.events set created_by = null where created_by in (select id from expired) returning 1
  ),
  gone_orders as (
    delete from public.orders where user_id in (select id from expired) returning 1
  )
  delete from auth.users where id in (select id from expired);
  get diagnostics v_accounts = row_count;

  return jsonb_build_object(
    'draft_orders', v_drafts,
    'orders', v_orders,
    'photos', v_photos,
    'check_ins', v_check_ins,
    'challenge_results', v_completions,
    'used_rewards', v_rewards,
    'accounts', v_accounts
  );
end;
$$;

revoke execute on function public.last_active_at(uuid) from public, anon, authenticated;
revoke execute on function public.retention_expired_accounts(timestamptz) from public, anon, authenticated;
revoke execute on function public.retention_photo_paths(timestamptz) from public, anon, authenticated;
revoke execute on function public.apply_retention(timestamptz) from public, anon, authenticated;
grant execute on function public.retention_photo_paths(timestamptz) to service_role;
grant execute on function public.retention_expired_accounts(timestamptz) to service_role;
grant execute on function public.apply_retention(timestamptz) to service_role;
