-- A pop-up sells the café's menu unless the owner picks another.
--
-- Pop-ups made in the app had no menu attached: "Order here" had nothing to
-- sell, and create_order refused with "No menu is available for this
-- location". Now a new pop-up gets the café's menu as it's made, and the
-- owner can still swap or add menus on the pop-up's page. Pop-ups still to
-- come that have no menu get the café's now.

create or replace function public.events_attach_default_menu()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.event_menus (event_id, menu_id)
  select new.id, s.menu_id
    from public.stores s
   where s.menu_id is not null
   order by s.created_at
   limit 1
  on conflict do nothing;
  return new;
end;
$$;

-- Fired by the database, never called.
revoke execute on function public.events_attach_default_menu() from public, anon, authenticated;

drop trigger if exists events_attach_default_menu on public.events;
create trigger events_attach_default_menu
  after insert on public.events
  for each row execute function public.events_attach_default_menu();

insert into public.event_menus (event_id, menu_id)
select e.id, s.menu_id
  from public.events e
  cross join lateral (
    select menu_id from public.stores where menu_id is not null order by created_at limit 1
  ) s
 where e.ends_at > now()
   and not exists (select 1 from public.event_menus em where em.event_id = e.id)
on conflict do nothing;
