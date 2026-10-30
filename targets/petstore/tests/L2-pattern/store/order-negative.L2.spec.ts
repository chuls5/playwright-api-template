import { expectStatus } from '../../../../../src';
import { test } from '../../../fixtures';

test.describe('order negative', { tag: ['@L2', '@pattern:validation'] }, () => {
  test('GET /store/order/{id} with non-numeric id → 400', { tag: '@api:getOrderById' }, async ({ petstore }) => {
    expectStatus(await petstore.getOrderById('abc'), 400);
  });

  test('GET /store/order/{id} for unknown id → 404', { tag: '@api:getOrderById' }, async ({ petstore }) => {
    expectStatus(await petstore.getOrderById(987_654_321_012), 404);
  });

  test('POST /store/order with malformed JSON → 400', { tag: '@api:placeOrder' }, async ({ petstore }) => {
    const res = await petstore.raw().post('store/order', { data: '{bad', headers: { 'Content-Type': 'application/json' } });
    expectStatus(res, 400);
  });
});
