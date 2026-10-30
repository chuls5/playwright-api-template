import { expectSchema, expectStatus } from '../../../../src';
import { cfg, emailFor, ROLES } from '../../config';
import { expect, test } from '../../fixtures';
import { Token, User } from '../../schemas';

test.describe('JWT login', { tag: '@L0' }, () => {
  for (const role of ROLES) {
    test(
      `POST /users/login as ${role} → 200 bearer JWT accepted by /users/me`,
      { tag: ['@api:login-customer', '@api:get-current-customer-info'] },
      async ({ toolshop, as }) => {
        const res = await toolshop.login(emailFor(role), cfg.TOOLSHOP_DEMO_PASSWORD);
        expectStatus(res, 200);
        const tok = expectSchema(res, Token);
        expect(tok.token_type).toBe('bearer');
        expect(tok.access_token.split('.')).toHaveLength(3);
        const me = await as(role).me();
        expectStatus(me, 200);
        expect(expectSchema(me, User).email).toBe(emailFor(role));
      },
    );
  }

  test('POST /users/login with wrong password → 401', { tag: '@api:login-customer' }, async ({ toolshop }) => {
    const res = await toolshop.login(emailFor('customer'), `${cfg.TOOLSHOP_DEMO_PASSWORD}-wrong`);
    expectStatus(res, 401);
  });

  test('GET /users/me without token → 401', { tag: '@api:get-current-customer-info' }, async ({ toolshop }) => {
    expectStatus(await toolshop.me(), 401);
  });

  test('GET /users/me with tampered JWT signature → 401', { tag: '@api:get-current-customer-info' }, async ({ toolshop }) => {
    const res = await toolshop.login(emailFor('customer'), cfg.TOOLSHOP_DEMO_PASSWORD);
    const [h, p] = res.body.access_token.split('.');
    const me = await toolshop.raw().get('users/me', { headers: { Authorization: `Bearer ${h}.${p}.invalidsignature` } });
    expectStatus(me, 401);
  });

  test('freshly registered shopper can log in and sees only itself', { tag: ['@api:storeUser', '@api:login-customer'] }, async ({ newShopper }) => {
    const s = await newShopper();
    const me = await s.client.me();
    expectStatus(me, 200);
    expect(me.body).toMatchObject({ id: s.id, email: s.email });
  });
});
