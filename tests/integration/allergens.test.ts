import { admin, deleteAccount, SEED, signUp, type Customer } from './helpers';

/** Allergens on menu items (0035): only the 14 EU allergens, readable before ordering. */
const ITEM = SEED.banhMiPork;

let customer: Customer;

beforeAll(async () => {
  customer = await signUp();
});
afterAll(async () => {
  await admin.from('menu_items').update({ allergens: null }).eq('id', ITEM);
  await deleteAccount(customer);
});

it('takes the 14 EU allergens, and nothing else', async () => {
  expect(
    (
      await admin
        .from('menu_items')
        .update({ allergens: ['gluten', 'soybeans'] })
        .eq('id', ITEM)
    ).error,
  ).toBeNull();
  expect((await admin.from('menu_items').update({ allergens: [] }).eq('id', ITEM)).error).toBeNull();
  const { error } = await admin
    .from('menu_items')
    .update({ allergens: ['gluten', 'pineapple'] })
    .eq('id', ITEM);
  expect(error?.code).toBe('23514');
});

it('can be read by a customer looking at the menu', async () => {
  await admin
    .from('menu_items')
    .update({ allergens: ['peanuts'] })
    .eq('id', ITEM);
  const { data, error } = await customer.client.from('menu_items').select('allergens').eq('id', ITEM).single();
  expect(error).toBeNull();
  expect(data!.allergens).toEqual(['peanuts']);
});
