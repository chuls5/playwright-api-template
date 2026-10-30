import { expectSchema, expectStatus } from '../../../../../src';
import { Inventory, Order } from '../../../schemas';
import { expect, test } from '../../../fixtures';

test.describe('store', { tag: '@L1' }, () => {
  test('POST /store/order for own pet → 200 placed order', { tag: ['@smoke', '@api:placeOrder'] }, async ({ petstore, newPet, rng, cleanup }) => {
    const pet = await newPet();
    const order = { id: rng.int(1, 9_999_999), petId: pet.id, quantity: 1, status: 'placed' as const, complete: false };
    const res = await petstore.placeOrder(order);
    cleanup.add({ type: 'order', id: String(order.id) }, () => petstore.deleteOrder(order.id));
    expectStatus(res, 200);
    expect(expectSchema(res, Order)).toMatchObject(order);
  });

  test('GET /store/order/{id} for own order → 200', { tag: '@api:getOrderById' }, async ({ petstore, newPet, rng, cleanup }) => {
    const pet = await newPet();
    const id = rng.int(1, 9_999_999);
    expectStatus(await petstore.placeOrder({ id, petId: pet.id, quantity: 2, status: 'placed', complete: false }), 200);
    cleanup.add({ type: 'order', id: String(id) }, () => petstore.deleteOrder(id));
    const res = await petstore.getOrderById(id);
    expectStatus(res, 200);
    expect(expectSchema(res, Order).quantity).toBe(2);
  });

  test('GET /store/inventory → 200 map of status → count', { tag: ['@smoke', '@api:getInventory'] }, async ({ petstore }) => {
    const res = await petstore.getInventory();
    expectStatus(res, 200);
    const inv = expectSchema(res, Inventory);
    for (const n of Object.values(inv)) expect(Number.isInteger(n)).toBe(true);
    // Public demo: counts come from everyone's orders and the server accepts negative quantities, so a negative
    // count is shared-data noise (Environment), not a contract break. Recorded, not asserted.
    const negative = Object.entries(inv).filter(([, n]) => n < 0);
    if (negative.length)
      test.info().annotations.push({ type: 'env', description: `shared demo data: negative counts ${JSON.stringify(Object.fromEntries(negative))}` });
  });
});
