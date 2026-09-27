-- The QR code printed at the venue is the only legitimate way to learn an
-- event's check-in token. If customers could just read it back over the API
-- (as they could with a plain row-level "events readable" policy), "scan the
-- QR" would verify nothing.
--
-- A column-level REVOKE alone can't achieve this: a role that also holds the
-- table-level SELECT grant (from `alter default privileges` in a real
-- Supabase project) can still read every column regardless of column-level
-- REVOKEs, since the table-level grant is a superset. So: revoke table-level
-- SELECT and re-grant it column-by-column, leaving `qr_token` out. Owner
-- tooling reads it through get_event_qr_token() below instead;
-- verify_check_in (SECURITY DEFINER, owned by the migration role) is
-- unaffected either way.
revoke select on public.events from authenticated;
grant select (
  id, title, type, city, venue, latitude, longitude, starts_at, ends_at, time_zone,
  description, image_url, tags, capacity, occupancy, status, order_url, created_by, created_at
) on public.events to authenticated;

create or replace function public.get_event_qr_token(p_event_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_token text;
begin
  if not public.is_owner() then
    raise exception 'Only an owner can read an event''s QR token';
  end if;

  select qr_token into v_token from public.events where id = p_event_id;
  return v_token;
end;
$$;

grant execute on function public.get_event_qr_token(uuid) to authenticated;
