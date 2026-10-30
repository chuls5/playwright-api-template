import { expectStatus, loginWithStepUp, overrideOtp, ssnStepUp, staticOtp, TokenCache } from '../../../../src';
import { cfg } from '../../config';
import { CHALLENGE_ENDPOINTS, user } from '../../identities';
import { expect, test } from '../../fixtures';

const endpoints = { logon: '/auth/login', challenges: CHALLENGE_ENDPOINTS, deliver: '/otp/delivery/v3', answer: '/authentication/token/v3' };

test.describe('user session token + step-up', { tag: ['@L0', '@api:user-step-up'] }, () => {
  test('logon + OTP step-up → elevated session token accepted by a money function', { tag: '@smoke' }, async ({ newCustomer, fnAsUser }) => {
    const c = await newCustomer();
    const [from, to] = c.accounts;
    const res = await fnAsUser(c.userFor('PRIMARY')).call(
      'CreateTransfer.v1',
      { fromAccountId: from!.accountId, toAccountId: to!.accountId, amountMinor: 100 },
      { idempotencyKey: crypto.randomUUID() },
    );
    expectStatus(res, 201);
  });

  test('SSN step-up (TAX_IDENTIFICATION_NO) → elevated session token', async ({ request, newCustomer }) => {
    const c = await newCustomer();
    const sessionToken = await loginWithStepUp(request, {
      identity: 'p',
      userId: c.userFor('PRIMARY').userId,
      password: cfg.MOCK_BANK_PASSWORD,
      otp: ssnStepUp(c.ssn),
      cache: new TokenCache(1000),
      endpoints,
    });
    expect(sessionToken).toBeTruthy();
  });

  test('wrong OTP → step-up rejected', async ({ request, newCustomer }) => {
    const c = await newCustomer();
    await expect(
      loginWithStepUp(request, {
        identity: 'p',
        userId: c.userFor('PRIMARY').userId,
        password: cfg.MOCK_BANK_PASSWORD,
        otp: overrideOtp('999999'),
        cache: new TokenCache(1000),
        endpoints,
      }),
    ).rejects.toThrow(/step-up failed: HTTP 401/);
  });

  test('wrong password → logon rejected', async ({ request, newCustomer }) => {
    const c = await newCustomer();
    await expect(
      loginWithStepUp(request, {
        identity: 'p',
        userId: c.userFor('PRIMARY').userId,
        password: `${cfg.MOCK_BANK_PASSWORD}-wrong`,
        otp: staticOtp(cfg.MOCK_BANK_OTP),
        cache: new TokenCache(1000),
        endpoints,
      }),
    ).rejects.toThrow(/logon failed: HTTP 401/);
  });

  test('challenge endpoint 404 → falls back to the next version', async ({ newCustomer, fnAsUser, userCache }) => {
    const c = await newCustomer();
    const u = c.userFor('PRIMARY');
    const auth = user(u, userCache, { challenges: ['/authentication/challenges/v99', ...CHALLENGE_ENDPOINTS] });
    expectStatus(await fnAsUser(u, auth).call('ReadAccounts.v1'), 200);
  });

  test('expired token → client re-authenticates once and succeeds', async ({ raw, newCustomer, fnAsUser }) => {
    const c = await newCustomer();
    const fn = fnAsUser(c.userFor('PRIMARY'));
    expectStatus(await fn.call('ReadAccounts.v1'), 200);
    expectStatus(await raw.post('/__admin/revoke-tokens'), 204);
    expectStatus(await fn.call('ReadAccounts.v1'), 200);
    expect(test.info().annotations.some((a) => a.type === 'reauth')).toBe(true);
  });
});
