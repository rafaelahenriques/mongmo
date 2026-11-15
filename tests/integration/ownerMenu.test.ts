/**
 * The owner's Menu tab writes to menu_items directly, so what it may do
 * rests on the table's rules: staff add, change, hide and delete items;
 * customers only read; an item taken off the menu can't be ordered; an
 * item that's on an order can't be deleted.
 */
import { admin, placeOrder, SEED, signUp, signUpOwner, type Customer } from './helpers';

const MENU_ID = '00000000-0000-0000-0000-0000000000d1';

let staff: Customer;
let alice: Customer;
const made: string[] = [];

beforeAll(async () => {
  [staff, alice] = await Promise.all([signUpOwner(), signUp()]);
});

afterAll(async () => {
  // Items no order points at go; the rest (ordered in a test) are hidden.
  for (const id of made) {
    const { error } = await admin.from('menu_items').delete().eq('id', id);
    if (error) await admin.from('menu_items').update({ available: false }).eq('id', id);
  }
});

const item = (name: string) => ({
  menu_id: MENU_ID,
  name,
  description: null,
  price_cents: 450,
  category: 'Bánh mì',
  sort_order: 99,
  available: true,
  add_on_for: null,
  allergens: null,
});

async function add(name: string): Promise<string> {
  const { data, error } = await staff.client.from('menu_items').insert(item(name)).select('id').single();
  if (error) throw error;
  made.push(data.id);
  return data.id;
}

it('lets staff add an item, change it and fill in its allergens', async () => {
  const id = await add('Bánh mì, test');
  const changed = await staff.client
    .from('menu_items')
    .update({ name: 'Bánh mì, tested', price_cents: 500, allergens: ['gluten', 'soybeans'] })
    .eq('id', id)
    .select('name, price_cents, allergens')
    .single();
  expect(changed.error).toBeNull();
  expect(changed.data).toEqual({ name: 'Bánh mì, tested', price_cents: 500, allergens: ['gluten', 'soybeans'] });

  // Customers read what staff wrote.
  const seen = await alice.client.from('menu_items').select('name, price_cents').eq('id', id).single();
  expect(seen.data).toEqual({ name: 'Bánh mì, tested', price_cents: 500 });
});

it("won't let a customer add, change, hide or delete an item", async () => {
  const id = await add('Bánh mì, staff only');
  expect((await alice.client.from('menu_items').insert(item('Free lunch'))).error).not.toBeNull();

  await alice.client.from('menu_items').update({ price_cents: 1, available: false }).eq('id', id);
  await alice.client.from('menu_items').delete().eq('id', id);
  const after = await admin.from('menu_items').select('price_cents, available').eq('id', id).single();
  expect(after.data).toEqual({ price_cents: 450, available: true });
});

it('refuses what the form refuses: no name, a negative or absurd price, an unknown allergen', async () => {
  const id = await add('Bánh mì, limits');
  const change = (values: Record<string, unknown>) =>
    staff.client
      .from('menu_items')
      .update(values as never)
      .eq('id', id);
  expect((await change({ name: '  ' })).error).not.toBeNull();
  expect((await change({ price_cents: -1 })).error).not.toBeNull();
  expect((await change({ price_cents: 100_001 })).error).not.toBeNull();
  expect((await change({ allergens: ['gluten', 'kryptonite'] })).error).not.toBeNull();
  expect((await change({ name: 'x'.repeat(81) })).error).not.toBeNull();
});

it("can't be ordered once it's off the menu, and can again when it's back", async () => {
  const id = await add('Bánh mì, sold out');
  expect((await staff.client.from('menu_items').update({ available: false }).eq('id', id)).error).toBeNull();
  await expect(placeOrder(alice, [{ menu_item_id: id, quantity: 1 }])).rejects.toMatchObject({
    message: expect.stringMatching(/not available/i),
  });

  expect((await staff.client.from('menu_items').update({ available: true }).eq('id', id)).error).toBeNull();
  const order = await placeOrder(alice, [{ menu_item_id: id, quantity: 1 }]);
  expect(order.total_cents).toBe(450);
});

it("can't be deleted while an order points at it, but can be hidden", async () => {
  const id = await add('Bánh mì, ordered');
  await placeOrder(alice, [{ menu_item_id: id, quantity: 1 }]);

  const gone = await staff.client.from('menu_items').delete().eq('id', id);
  expect(gone.error?.code).toBe('23503');
  expect((await staff.client.from('menu_items').update({ available: false }).eq('id', id)).error).toBeNull();

  // One nobody ordered goes for good.
  const unused = await add('Bánh mì, never ordered');
  expect((await staff.client.from('menu_items').delete().eq('id', unused)).error).toBeNull();
  expect((await admin.from('menu_items').select('id').eq('id', unused)).data).toEqual([]);
});

it('makes an option for a section, priced on the server like the others', async () => {
  const { data, error } = await staff.client
    .from('menu_items')
    .insert({ ...item('Extra test sauce'), price_cents: 70, category: 'Extras', add_on_for: ['Springrolls'] })
    .select('id')
    .single();
  expect(error).toBeNull();
  made.push(data!.id);

  const order = await placeOrder(alice, [
    { menu_item_id: SEED.springrollsTofu, quantity: 1, options: [SEED.mangoSauce, data!.id] },
  ]);
  const plain = await placeOrder(alice, [
    { menu_item_id: SEED.springrollsTofu, quantity: 1, options: [SEED.mangoSauce] },
  ]);
  expect(order.total_cents - plain.total_cents).toBe(70);
});
