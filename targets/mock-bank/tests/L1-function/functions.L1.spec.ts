import { z } from 'zod';
import { expectSchema, expectStatus } from '../../../../src';
import { expect, test } from '../../fixtures';

const Limits = z.object({
  limits: z.array(z.object({ type: z.enum(['PER_TXN', 'DAILY', 'WEEKLY']), limitMinor: z.number().int(), utilizedMinor: z.number().int() })),
});
const Accounts = z.object({ accounts: z.array(z.object({ accountId: z.string(), customerId: z.string(), balanceMinor: z.number().int() })) });

test.describe('function-API functions', { tag: '@L1' }, () => {
  test('ReadAccounts.v1 → 200 own accounts only', { tag: ['@smoke', '@api:ReadAccounts.v1'] }, async ({ newCustomer, fnAsUser }) => {
    const c = await newCustomer();
    const body = expectSchema(await fnAsUser(c.userFor('PRIMARY')).call('ReadAccounts.v1'), Accounts);
    expect(body.accounts.map((a) => a.accountId).sort()).toEqual(c.accounts.map((a) => a.accountId).sort());
  });

  test('ReadTransactionLimits.v1 (user) → 200 three limits', { tag: '@api:ReadTransactionLimits.v1' }, async ({ newCustomer, fnAsUser }) => {
    const c = await newCustomer();
    const res = await fnAsUser(c.userFor('PRIMARY')).call('ReadTransactionLimits.v1');
    expectStatus(res, 200);
    expect(
      expectSchema(res, Limits)
        .limits.map((l) => l.type)
        .sort(),
    ).toEqual(['DAILY', 'PER_TXN', 'WEEKLY']);
  });

  test(
    'ReadTransactionLimits.v2 (service) → same limits as the user view',
    { tag: '@api:ReadTransactionLimits.v2' },
    async ({ newCustomer, fnAs, fnAsUser }) => {
      const c = await newCustomer();
      const svc = expectSchema(await fnAs('limits').call('ReadTransactionLimits.v2', { customerId: c.customerId }), Limits);
      const usr = expectSchema(await fnAsUser(c.userFor('PRIMARY')).call('ReadTransactionLimits.v1'), Limits);
      expect(svc).toEqual(usr);
    },
  );

  test('ReadCustomer.v1 → stakeholders with roles', { tag: '@api:ReadCustomer.v1' }, async ({ newCustomer, fnAs }) => {
    const c = await newCustomer({ stakeholders: ['JOINT_OWNER'] });
    const res = await fnAs('core').call<{ stakeholders: { role: string }[] }>('ReadCustomer.v1', { customerId: c.customerId });
    expectStatus(res, 200);
    expect(res.body.stakeholders.map((s) => s.role).sort()).toEqual(['JOINT_OWNER', 'PRIMARY']);
  });

  test('CreatePayee.v1 → 201', { tag: '@api:CreatePayee.v1' }, async ({ newCustomer, fnAsUser, rng }) => {
    const c = await newCustomer();
    const nickname = `payee-${rng.letters(6)}`;
    const res = await fnAsUser(c.userFor('PRIMARY')).call('CreatePayee.v1', { nickname });
    expectStatus(res, 201);
    expect(res.body).toMatchObject({ nickname });
  });

  test(
    'account restriction create → read → delete',
    { tag: ['@api:CreateAccountHold.v1', '@api:ReadAccountHolds.v1', '@api:DeleteAccountHold.v1'] },
    async ({ newCustomer, fnAs, cleanup }) => {
      const c = await newCustomer();
      const fn = fnAs('servicing');
      const accountId = c.accounts[0]!.accountId;
      const created = await fn.call<{ restrictionId: string }>('CreateAccountHold.v1', { accountId, code: 'DEBIT_FREEZE' });
      expectStatus(created, 201);
      cleanup.add({ type: 'restriction', id: created.body.restrictionId }, () =>
        fn.call('DeleteAccountHold.v1', { restrictionId: created.body.restrictionId }),
      );
      const read = await fn.call<{ restrictions: { code: string }[] }>('ReadAccountHolds.v1', { accountId });
      expect(read.body.restrictions.map((r) => r.code)).toEqual(['DEBIT_FREEZE']);
      expectStatus(await fn.call('DeleteAccountHold.v1', { restrictionId: created.body.restrictionId }), 204);
    },
  );

  test('missing x-user-role header → 400 MISSING_HEADER', { tag: ['@api:GetNextBusinessDay.v1', '@pattern:headers'] }, async ({ raw }) => {
    const res = await raw.post('/api/functions/GetNextBusinessDay.v1', {
      data: { fromDate: '2026-11-02' },
      headers: { 'x-correlation-id': 'x', 'x-user-id': 'svc' },
    });
    expectStatus(res, 400);
    expect(res.body).toMatchObject({ code: 'MISSING_HEADER', message: 'x-user-role' });
  });

  test(
    'service token without the function scope → 403 SCOPE_MISSING',
    { tag: ['@api:ReadTransactionLimits.v2', '@pattern:authz'] },
    async ({ newCustomer, fnAs }) => {
      const c = await newCustomer();
      const res = await fnAs('core').call('ReadTransactionLimits.v2', { customerId: c.customerId });
      expectStatus(res, 403);
      expect(res.body).toMatchObject({ code: 'SCOPE_MISSING' });
    },
  );
});
