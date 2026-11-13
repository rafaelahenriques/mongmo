-- Allergens on the menu.
--
-- EU food information rules (Regulation 1169/2011) say people must be able
-- to see which of the 14 main allergens a dish contains before they order
-- it, also when they order through an app. Each menu item, dips and extras
-- included, lists them here; the app shows them on the item's page.
--
--   null      not filled in yet: the app says so and to ask before ordering
--   '{}'      none of the 14
--   '{…}'     the ones it contains
--
-- Fill them in from the kitchen's recipes (see supabase/base.sql).
-- Idempotent.

alter table public.menu_items add column if not exists allergens text[];

alter table public.menu_items drop constraint if exists menu_items_allergens_check;
alter table public.menu_items add constraint menu_items_allergens_check
  check (
    allergens is null
    or allergens <@ array[
      'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soybeans', 'milk',
      'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs'
    ]::text[]
  );

comment on column public.menu_items.allergens is
  'Which of the 14 EU allergens the item contains; null = not filled in yet, {} = none.';
