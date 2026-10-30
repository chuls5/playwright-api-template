import { randomUUID } from 'node:crypto';
import { expectStatus, usd } from '../../../../src';
import { cfg } from '../../config';
import { expect, test } from '../../fixtures';

const FN = 'CreateTransfer.v1' as const;
const balances = (b: unknown) =>
  Object.fromEntries((b as { accounts: { accountId: string; balanceMinor: number }[] }).accounts.map((a) => [a.accountId, a.balanceMinor]));

test.describe('fund transfer', { tag: ['@L2', `@api:${FN}`] }, () => {
  test('same Idempotency-Key + same body → replayed, debited once', { tag: ['@smoke', '@pattern:idempotency'] }, async ({ newCustomer, fnAsUser }) => {
    const c = await newCustomer();
    const fn = fnAsUser(c.userFor('PRIMARY'));
    const [from, to] = c.accounts;
    const body = { fromAccountId: from!.accountId, toAccountId: to!.accountId, ...usd(1_234) };
    const key = randomUUID();
    const first = await fn.call(FN, body, { idempotencyKey: key });
    const second = await fn.call(FN, body, { idempotencyKey: key });
    expectStatus(first, 201);
    expectStatus(second, 201);
    expect(second.headers['idempotent-replayed']).toBe('true');
    expect(second.body).toEqual(first.body);
    expect(balances((await fn.call('ReadAccounts.v1')).body)[from!.accountId]).toBe(from!.balanceMinor - 1_234);
  });

  test('same Idempotency-Key + different body → 422 IDEMPOTENCY_KEY_REUSED', { tag: '@pattern:idempotency' }, async ({ newCustomer, fnAsUser }) => {
    const c = await newCustomer();
    const fn = fnAsUser(c.userFor('PRIMARY'));
    const base = { fromAccountId: c.accounts[0]!.accountId, toAccountId: c.accounts[1]!.accountId };
    const key = randomUUID();
    expectStatus(await fn.call(FN, { ...base, amountMinor: 100 }, { idempotencyKey: key }), 201);
    const res = await fn.call(FN, { ...base, amountMinor: 200 }, { idempotencyKey: key });
    expectStatus(res, 422);
    expect(res.body).toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED' });
  });

  test('missing Idempotency-Key → 400', { tag: '@pattern:idempotency' }, async ({ newCustomer, fnAsUser }) => {
    const c = await newCustomer();
    const res = await fnAsUser(c.userFor('PRIMARY')).call(FN, {
      fromAccountId: c.accounts[0]!.accountId,
      toAccountId: c.accounts[1]!.accountId,
      amountMinor: 100,
    });
    expectStatus(res, 400);
    expect(res.body).toMatchObject({ code: 'IDEMPOTENCY_KEY_REQUIRED' });
  });

  test('limits: read first, then size amounts at PER_TXN, PER_TXN+1 and the DAILY edge', { tag: '@pattern:limits' }, async ({ newCustomer, fnAsUser }) => {
    const c = await newCustomer({ openingDepositMinor: 5_000_000 });
    const fn = fnAsUser(c.userFor('PRIMARY'));
    const limits = (await fn.call<{ limits: { type: string; limitMinor: number; utilizedMinor: number }[] }>('ReadTransactionLimits.v1')).body.limits;
    const lim = (t: string) => limits.find((l) => l.type === t)!;
    const perTxn = lim('PER_TXN').limitMinor;
    const dailyLeft = lim('DAILY').limitMinor - lim('DAILY').utilizedMinor;
    const t = (amountMinor: number) =>
      fn.call(FN, { fromAccountId: c.accounts[0]!.accountId, toAccountId: c.accounts[1]!.accountId, amountMinor }, { idempotencyKey: randomUUID() });

    const over = await t(perTxn + 1);
    expectStatus(over, 422);
    expect(over.body).toMatchObject({ code: 'LIMIT_EXCEEDED', message: 'PER_TXN' });

    // Fill daily headroom exactly with PER_TXN-sized chunks, then one more minor unit must fail on DAILY.
    let left = dailyLeft;
    while (left > 0) {
      const amt = Math.min(perTxn, left);
      expectStatus(await t(amt), 201);
      left -= amt;
    }
    const edge = await t(1);
    expectStatus(edge, 422);
    expect(edge.body).toMatchObject({ code: 'LIMIT_EXCEEDED', message: 'DAILY' });
  });

  const invalid: [string, unknown, string][] = [
    ['zero', 0, 'INVALID_AMOUNT'],
    ['negative', -1, 'INVALID_AMOUNT'],
    ['fractional', 10.5, 'INVALID_AMOUNT'],
    ['string', '100', 'INVALID_AMOUNT'],
  ];
  for (const [name, amountMinor, code] of invalid) {
    test(`amount ${name} → 400 ${code}`, { tag: '@pattern:validation' }, async ({ newCustomer, fnAsUser }) => {
      const c = await newCustomer();
      const res = await fnAsUser(c.userFor('PRIMARY')).call(
        FN,
        { fromAccountId: c.accounts[0]!.accountId, toAccountId: c.accounts[1]!.accountId, amountMinor },
        { idempotencyKey: randomUUID() },
      );
      expectStatus(res, 400);
      expect(res.body).toMatchObject({ code });
    });
  }

  test('amount above balance → 422 INSUFFICIENT_FUNDS', { tag: '@pattern:validation' }, async ({ newCustomer, fnAsUser }) => {
    const c = await newCustomer({ openingDepositMinor: 500 });
    const res = await fnAsUser(c.userFor('PRIMARY')).call(
      FN,
      { fromAccountId: c.accounts[0]!.accountId, toAccountId: c.accounts[1]!.accountId, amountMinor: 501 },
      { idempotencyKey: randomUUID() },
    );
    expectStatus(res, 422);
    expect(res.body).toMatchObject({ code: 'INSUFFICIENT_FUNDS' });
  });

  test('from = to → 422 SAME_ACCOUNT', { tag: '@pattern:validation' }, async ({ newCustomer, fnAsUser }) => {
    const c = await newCustomer();
    const id = c.accounts[0]!.accountId;
    const res = await fnAsUser(c.userFor('PRIMARY')).call(FN, { fromAccountId: id, toAccountId: id, amountMinor: 100 }, { idempotencyKey: randomUUID() });
    expectStatus(res, 422);
  });

  test('non-elevated session token (no step-up) → 403 STEP_UP_REQUIRED', { tag: '@pattern:authz' }, async ({ newCustomer, raw }) => {
    const c = await newCustomer();
    const u = c.userFor('PRIMARY');
    const logon = await raw.post<{ sessionToken: string }>('/auth/login', { form: { UserID: u.userId, Password: cfg.MOCK_BANK_PASSWORD } });
    const res = await raw.post(`/api/functions/${FN}`, {
      data: { fromAccountId: c.accounts[0]!.accountId, toAccountId: c.accounts[1]!.accountId, amountMinor: 100 },
      idempotencyKey: randomUUID(),
      headers: {
        Authorization: `Bearer ${logon.body.sessionToken}`,
        'x-correlation-id': randomUUID(),
        'x-user-id': u.userId,
        'x-user-role': u.role,
      },
    });
    expectStatus(res, 403);
    expect(res.body).toMatchObject({ code: 'STEP_UP_REQUIRED' });
  });
});
