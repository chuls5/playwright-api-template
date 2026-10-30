import { randomUUID } from 'node:crypto';
import { expectStatus } from '../../../../src';
import { expect, test } from '../../fixtures';

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (s: string, n: number) => {
  const d = new Date(`${s}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};

test.describe('business day', { tag: ['@L2', '@pattern:business-day'] }, () => {
  // Known answers from the mock holiday calendar (US Thanksgiving 2026-11-26, Christmas 2026-12-25).
  const cases: [string, string, string][] = [
    ['weekday → next day', '2026-11-02', '2026-11-03'],
    ['Friday → Monday', '2026-11-06', '2026-11-09'],
    ['day before holiday → skips holiday', '2026-11-25', '2026-11-27'],
    ['holiday then weekend', '2026-12-24', '2026-12-28'],
  ];
  for (const [name, fromDate, expected] of cases) {
    test(`GetNextBusinessDay ${name}`, { tag: '@api:GetNextBusinessDay.v1' }, async ({ fnAs }) => {
      const res = await fnAs('core').call<{ nextBusinessDay: string }>('GetNextBusinessDay.v1', { fromDate });
      expectStatus(res, 200);
      expect(res.body.nextBusinessDay).toBe(expected);
    });
  }

  test('GetNextBusinessDay with bad date → 400', { tag: '@api:GetNextBusinessDay.v1' }, async ({ fnAs }) => {
    expectStatus(await fnAs('core').call('GetNextBusinessDay.v1', { fromDate: '11/02/2026' }), 400);
  });

  test.describe('scheduled transfer', { tag: '@api:CreateScheduledTransfer.v1' }, () => {
    test('on a future business day (from the calendar function) → 201 SCHEDULED', async ({ newCustomer, fnAs }) => {
      const c = await newCustomer();
      const day = (await fnAs('core').call<{ nextBusinessDay: string }>('GetNextBusinessDay.v1', { fromDate: addDays(iso(new Date()), 7) })).body
        .nextBusinessDay;
      const res = await fnAs('payments').call(
        'CreateScheduledTransfer.v1',
        { fromAccountId: c.accounts[0]!.accountId, toAccountId: c.accounts[1]!.accountId, amountMinor: 500, executionDate: day },
        { idempotencyKey: randomUUID() },
      );
      expectStatus(res, 201);
      expect(res.body).toMatchObject({ status: 'SCHEDULED', executionDate: day });
    });

    test('on today → 422 DATE_NOT_IN_FUTURE', async ({ newCustomer, fnAs }) => {
      const c = await newCustomer();
      const res = await fnAs('payments').call(
        'CreateScheduledTransfer.v1',
        { fromAccountId: c.accounts[0]!.accountId, toAccountId: c.accounts[1]!.accountId, amountMinor: 500, executionDate: iso(new Date()) },
        { idempotencyKey: randomUUID() },
      );
      expectStatus(res, 422);
      expect(res.body).toMatchObject({ code: 'DATE_NOT_IN_FUTURE' });
    });

    test('on a future Saturday → 422 NOT_BUSINESS_DAY', async ({ newCustomer, fnAs }) => {
      const c = await newCustomer();
      let sat = addDays(iso(new Date()), 7);
      while (new Date(`${sat}T12:00:00Z`).getUTCDay() !== 6) sat = addDays(sat, 1);
      const res = await fnAs('payments').call(
        'CreateScheduledTransfer.v1',
        { fromAccountId: c.accounts[0]!.accountId, toAccountId: c.accounts[1]!.accountId, amountMinor: 500, executionDate: sat },
        { idempotencyKey: randomUUID() },
      );
      expectStatus(res, 422);
      expect(res.body).toMatchObject({ code: 'NOT_BUSINESS_DAY' });
    });
  });
});
