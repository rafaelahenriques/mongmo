-- The levels take their names from the bánh mì's own bake: Dough, Rising,
-- Golden, Crisp. 0021 first named them Rice, Bamboo, Lotus and Jade; on a
-- database that already has those, this renames them (keeping each level's
-- points, bonus and reward). On a fresh database it changes nothing.

do $$
begin
  if exists (select 1 from public.levels where key in ('rice', 'bamboo', 'lotus', 'jade')) then
    -- The level rewards point at the old keys: let go of them first.
    update public.rewards set min_level = null where min_level in ('rice', 'bamboo', 'lotus', 'jade');
    delete from public.levels where key in ('rice', 'bamboo', 'lotus', 'jade');

    insert into public.levels (key, name, min_points, order_bonus_pct, perk) values
      ('dough', 'Dough', 0, 0, 'Points on every order and challenge'),
      ('rising', 'Rising', 500, 10, '+10% points on orders, and a Mongmo tote bag to claim'),
      ('golden', 'Golden', 1500, 25, '+25% points on orders, and a free Vietnamese stew to claim'),
      ('crisp', 'Crisp', 4000, 50, '+50% points on orders, and 2 free bánh mì to share')
    on conflict (key) do update set
      name = excluded.name,
      min_points = excluded.min_points,
      order_bonus_pct = excluded.order_bonus_pct,
      perk = excluded.perk;

    update public.rewards r set min_level = v.level, description = v.description
    from (values
      ('00000000-0000-0000-0000-0000000000a5'::uuid, 'rising', 'For Rising and up: the canvas tote, yours to keep'),
      ('00000000-0000-0000-0000-0000000000a6'::uuid, 'golden', 'For Golden and up: bò kho or gà cà ri, your pick'),
      ('00000000-0000-0000-0000-0000000000a7'::uuid, 'crisp', 'For Crisp: one for you, one for a friend')
    ) as v(id, level, description)
    where r.id = v.id;
  end if;
end;
$$;
