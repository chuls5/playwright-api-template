import { expect, test } from '@playwright/test';
import { cfg, emailFor } from './config';

// Precheck for the shared demo: catalogue up and demo accounts usable (both fail while the DB resets).
test('toolshop reachable', { tag: ['@L0', '@smoke'] }, async ({ request }) => {
  const res = await request.get('products', { headers: { Accept: 'application/json' } });
  expect(res.status(), 'env-unavailable: practicesoftwaretesting.com API is down; toolshop project cannot run').toBe(200);
  const login = await request.post('users/login', {
    headers: { Accept: 'application/json' },
    data: { email: emailFor('customer'), password: cfg.TOOLSHOP_DEMO_PASSWORD },
  });
  expect(login.status(), 'env-unavailable: toolshop demo login failed (DB reset in progress?); toolshop project cannot run').toBe(200);
});
