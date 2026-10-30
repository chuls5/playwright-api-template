import { expect, test } from '@playwright/test';

test('mock-bank reachable', { tag: ['@L0', '@smoke'] }, async ({ request }) => {
  const res = await request.get('/health');
  expect(res.status(), 'mock-bank is not running (webServer should start it)').toBe(200);
});
