import { randomUUID } from 'node:crypto';
import { expectStatus, withRetry } from '../../../../src';
import { expect, test } from '../../fixtures';

const FN = 'GetNextBusinessDay.v1' as const;
const body = { fromDate: '2026-11-02' };

test.describe('fault handling', { tag: ['@L2', '@pattern:faults', `@api:${FN}`] }, () => {
  for (const code of [500, 504] as const) {
    test(`injected ${code} is surfaced, not retried by default`, async ({ fnAs }) => {
      expectStatus(await fnAs('core').call(FN, body, { headers: { 'x-mock-fault': String(code) } }), code);
    });
  }

  test('flaky 503 ×2 → opt-in withRetry(3) succeeds', async ({ fnAs }) => {
    const key = randomUUID();
    const fn = fnAs('core');
    const res = await withRetry(() => fn.call(FN, body, { headers: { 'x-mock-fault': `flaky:2:${key}` } }), { attempts: 3, delayMs: 50, on: [503] });
    expectStatus(res, 200);
  });

  test('flaky 503 without retry → 503 (no hidden retries)', async ({ fnAs }) => {
    expectStatus(await fnAs('core').call(FN, body, { headers: { 'x-mock-fault': `flaky:1:${randomUUID()}` } }), 503);
  });

  test('persistent 401 → exactly one re-auth, then 401 is returned', async ({ fnAs }) => {
    const res = await fnAs('core').call(FN, body, { headers: { 'x-mock-fault': '401' } });
    expectStatus(res, 401);
    expect(test.info().annotations.filter((a) => a.type === 'reauth')).toHaveLength(1);
  });

  test('slow response (300 ms) is measured in durationMs', async ({ fnAs }) => {
    const res = await fnAs('core').call(FN, body, { headers: { 'x-mock-fault': 'delay:300' } });
    expectStatus(res, 200);
    expect(res.durationMs).toBeGreaterThanOrEqual(290);
  });
});
