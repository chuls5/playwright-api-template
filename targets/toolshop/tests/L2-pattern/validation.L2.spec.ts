import { expectStatus } from '../../../../src';
import { expect, registration as valid, test } from '../../fixtures';

test.describe('register validation', { tag: ['@L2', '@pattern:validation', '@api:storeUser'] }, () => {
  test('weak password → 422 password errors, nothing created', async ({ toolshop, rng }) => {
    // eslint-disable-next-line local/no-secret-literals -- deliberately invalid input, not a credential
    const res = await toolshop.storeUser({ ...valid(rng), password: 'abc' });
    expectStatus(res, 422);
    expect(res.body).toHaveProperty('password');
  });

  test('missing email → 422 email error', async ({ toolshop, rng }) => {
    const body: Partial<ReturnType<typeof valid>> = valid(rng);
    delete body.email;
    const res = await toolshop.storeUser(body);
    expectStatus(res, 422);
    expect(res.body).toHaveProperty('email');
  });

  test('under 18 → 422 dob error', async ({ toolshop, rng }) => {
    const res = await toolshop.storeUser({ ...valid(rng), dob: `${new Date().getFullYear() - 10}-01-01` });
    expectStatus(res, 422);
    expect(JSON.stringify(res.body)).toMatch(/18 years/);
  });

  test('duplicate email → 409', async ({ toolshop, newShopper, rng }) => {
    const s = await newShopper();
    const res = await toolshop.storeUser({ ...valid(rng), email: s.email });
    expectStatus(res, 409);
  });
});

test.describe('cart validation', { tag: ['@L2', '@pattern:validation', '@api:addItem'] }, () => {
  test('unknown product_id → 422, cart unchanged', async ({ toolshop, newCart }) => {
    const cart = await newCart();
    const res = await toolshop.addItem(cart.id, '00000000000000000000000000', 1);
    expectStatus(res, 422);
    expect((await toolshop.getCart(cart.id)).body.cart_items).toEqual([]);
  });

  test('quantity 0 → 422', async ({ toolshop, newCart }) => {
    const product = (await toolshop.getProducts()).body.data[0]!;
    const cart = await newCart();
    expectStatus(await toolshop.addItem(cart.id, product.id, 0), 422);
  });

  test('unknown product id on GET → 404 not-found body', { tag: '@api:getProduct' }, async ({ toolshop }) => {
    const res = await toolshop.getProduct('00000000000000000000000000');
    expectStatus(res, 404);
    expect(res.body).toEqual({ message: 'Requested item not found' });
  });
});
