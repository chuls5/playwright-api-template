import { randomUUID } from 'node:crypto';
import { expectStatus } from '../../../../src';
import { expect, test } from '../../fixtures';

const CREATE = 'CreateAccountHold.v1';
const READ = 'ReadAccountHolds.v1';
const DELETE = 'DeleteAccountHold.v1';

test.describe('account restrictions', { tag: ['@L2'] }, () => {
  test('Create with unknown accountId → 404 ACCOUNT_NOT_FOUND', { tag: [`@api:${CREATE}`, '@pattern:validation'] }, async ({ fnAs }) => {
    const res = await fnAs('servicing').call(CREATE, { accountId: randomUUID(), code: 'DEBIT_FREEZE' });
    expectStatus(res, 404);
    expect(res.body).toMatchObject({ code: 'ACCOUNT_NOT_FOUND' });
  });

  test('Create with code outside enum → 400 INVALID_CODE', { tag: [`@api:${CREATE}`, '@pattern:validation'] }, async ({ newCustomer, fnAs }) => {
    const fn = fnAs('servicing');
    const accountId = (await newCustomer()).accounts[0]!.accountId;
    const res = await fn.call(CREATE, { accountId, code: 'THAW' });
    expectStatus(res, 400);
    expect(res.body).toMatchObject({ code: 'INVALID_CODE' });
    expect((await fn.call<{ restrictions: unknown[] }>(READ, { accountId })).body.restrictions).toEqual([]);
  });

  test('Delete unknown restrictionId → 404 RESTRICTION_NOT_FOUND', { tag: [`@api:${DELETE}`, '@pattern:validation'] }, async ({ fnAs }) => {
    const res = await fnAs('servicing').call(DELETE, { restrictionId: randomUUID() });
    expectStatus(res, 404);
    expect(res.body).toMatchObject({ code: 'RESTRICTION_NOT_FOUND' });
  });

  test('Delete twice → 204 then 404', { tag: [`@api:${DELETE}`, '@pattern:idempotency'] }, async ({ newCustomer, fnAs, cleanup }) => {
    const fn = fnAs('servicing');
    const accountId = (await newCustomer()).accounts[0]!.accountId;
    const created = await fn.call<{ restrictionId: string }>(CREATE, { accountId, code: 'FULL_FREEZE' });
    expectStatus(created, 201);
    const { restrictionId } = created.body;
    cleanup.add({ type: 'restriction', id: restrictionId }, () => fn.call(DELETE, { restrictionId }));
    expectStatus(await fn.call(DELETE, { restrictionId }), 204);
    expectStatus(await fn.call(DELETE, { restrictionId }), 404);
  });

  test('Read for unknown accountId → 200 empty list (mock)', { tag: [`@api:${READ}`, '@pattern:validation'] }, async ({ fnAs }) => {
    const res = await fnAs('servicing').call(READ, { accountId: randomUUID() });
    expectStatus(res, 200);
    expect(res.body).toEqual({ restrictions: [] });
  });

  test('Create with service token lacking scope → 403 SCOPE_MISSING', { tag: [`@api:${CREATE}`, '@pattern:authz'] }, async ({ newCustomer, fnAs }) => {
    const accountId = (await newCustomer()).accounts[0]!.accountId;
    const res = await fnAs('core').call(CREATE, { accountId, code: 'DEBIT_FREEZE' });
    expectStatus(res, 403);
    expect(res.body).toMatchObject({ code: 'SCOPE_MISSING' });
  });
});
