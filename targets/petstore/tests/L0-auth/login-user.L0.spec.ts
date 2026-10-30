import { expectStatus } from '../../../../src';
import { expect, test } from '../../fixtures';

test.describe('loginUser', { tag: ['@L0', '@api:loginUser'] }, () => {
  test('GET /user/login with credentials → 200 and a session message', { tag: '@smoke' }, async ({ petstore, rng }) => {
    const res = await petstore.loginUser(`poc${rng.letters(6)}`, 'not-a-real-password');
    expectStatus(res, 200);
    expect(res.text).toMatch(/session/i);
    expect(res.headers['x-expires-after']).toBeTruthy();
  });

  test('GET /user/logout → 200', async ({ petstore }) => {
    expectStatus(await petstore.logoutUser(), 200);
  });
});
