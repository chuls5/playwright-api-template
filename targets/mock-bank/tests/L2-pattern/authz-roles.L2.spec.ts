import { randomUUID } from 'node:crypto';
import type { FunctionId } from '../../../../src';
import { expectStatus } from '../../../../src';
import type { Customer } from '../../fixtures';
import { ROLES, type Role } from '../../identities';
import { expect, test } from '../../fixtures';

/**
 * Role × capability matrix. PRIMARY/JOINT_OWNER/VIEW_ONLY rows mirror the real suite's intent.
 * POWER_OF_ATTORNEY row is a MOCK ASSUMPTION (reads only) — the real suite has zero POA assertions. Confirm before porting.
 */
type Op = { fn: FunctionId; body: (c: Customer) => unknown; okStatus: number; idem?: boolean };
const OPS: Record<'read' | 'statement' | 'servicing' | 'money', Op> = {
  read: { fn: 'ReadAccounts.v1', body: () => ({}), okStatus: 200 },
  statement: { fn: 'ReadStatement.v1', body: (c) => ({ accountId: c.accounts[0]!.accountId }), okStatus: 200 },
  servicing: { fn: 'CreatePayee.v1', body: () => ({ nickname: 'authz-payee' }), okStatus: 201 },
  money: {
    fn: 'CreateTransfer.v1',
    body: (c) => ({ fromAccountId: c.accounts[0]!.accountId, toAccountId: c.accounts[1]!.accountId, amountMinor: 100 }),
    okStatus: 201,
    idem: true,
  },
};
const MATRIX: Record<Role, Record<keyof typeof OPS, boolean>> = {
  PRIMARY: { read: true, statement: true, servicing: true, money: true },
  JOINT_OWNER: { read: true, statement: true, servicing: true, money: true },
  POWER_OF_ATTORNEY: { read: true, statement: true, servicing: false, money: false },
  VIEW_ONLY: { read: true, statement: false, servicing: false, money: false },
};

test.describe('authz by role', { tag: ['@L2', '@pattern:authz'] }, () => {
  for (const role of ROLES) {
    for (const [cap, op] of Object.entries(OPS) as [keyof typeof OPS, Op][]) {
      const allowed = MATRIX[role][cap];

      test(`${role} ${allowed ? 'can' : 'cannot'} ${cap} (${op.fn})`, { tag: `@api:${op.fn}` }, async ({ newCustomer, fnAsUser }) => {
        const c = await newCustomer({ stakeholders: ROLES.filter((r) => r !== 'PRIMARY') });
        const res = await fnAsUser(c.userFor(role)).call(op.fn, op.body(c), op.idem ? { idempotencyKey: randomUUID() } : {});
        if (allowed) expectStatus(res, op.okStatus);
        else {
          expectStatus(res, 403);
          expect(res.body).toMatchObject({ code: 'UNAUTHORIZED' });
        }
      });
    }
  }

  test('user cannot read another customer’s statement → 404', { tag: '@api:ReadStatement.v1' }, async ({ newCustomer, fnAsUser }) => {
    const mine = await newCustomer();
    const theirs = await newCustomer();
    const res = await fnAsUser(mine.userFor('PRIMARY')).call('ReadStatement.v1', { accountId: theirs.accounts[0]!.accountId });
    expectStatus(res, 404);
  });
});
