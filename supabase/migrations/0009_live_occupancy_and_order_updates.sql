-- 1. "How busy right now" never counted anyone who actually showed up:
-- occupancy was only ever the seeded number. Each verified check-in now
-- adds one, capped at capacity. A trigger (not a line in verify_check_in)
-- so any future way of recording a check-in counts too. The UPDATE on
-- events is what Realtime pushes to every open "how busy" meter.
create or replace function public.bump_occupancy_on_check_in()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.events
    set occupancy = least(occupancy + 1, capacity)
    where id = new.event_id;
  return new;
end;
$$;

drop trigger if exists check_ins_bump_occupancy on public.check_ins;
create trigger check_ins_bump_occupancy
  after insert on public.check_ins
  for each row execute function public.bump_occupancy_on_check_in();

-- 2. Order-status notifications listen for postgres_changes on orders, but
-- 0005 only published stores and events — so they could never fire.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
