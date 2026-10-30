import { expect, test } from '@playwright/test';

test('petstore reachable', { tag: ['@L0', '@smoke'] }, async ({ request }) => {
  const res = await request.get('store/inventory');
  expect(res.status(), 'env-unavailable: Swagger Petstore is down; petstore project cannot run').toBe(200);
});
