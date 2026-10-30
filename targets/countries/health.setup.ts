import { expect, test } from '@playwright/test';

test('countries graphql reachable', { tag: ['@L0', '@smoke'] }, async ({ request }) => {
  const res = await request.post('graphql', { data: { query: '{ __typename }' } });
  expect(res.status(), 'env-unavailable: countries.trevorblades.com is down; countries project cannot run').toBe(200);
});
