import { expectSchema, expectStatus } from '../../../../src';
import { expect, test } from '../../fixtures';
import { GqlErrors } from '../../schemas';

test.describe('GraphQL error semantics', { tag: ['@L2', '@pattern:validation'] }, () => {
  test('unknown code → 200, data.country null, no errors (not-found is not an error)', { tag: '@api:country' }, async ({ countries }) => {
    const res = await countries.country('ZZ');
    expectStatus(res, 200);
    expect(res.body).toEqual({ data: { country: null } });
  });

  test('unknown field → 200 with GRAPHQL_VALIDATION_FAILED, no data', { tag: '@api:country' }, async ({ countries }) => {
    const res = await countries.gql('query { country(code: "US") { nope } }');
    expectStatus(res, 200);
    const body = expectSchema(res, GqlErrors);
    expect(body.errors[0]?.extensions?.code).toBe('GRAPHQL_VALIDATION_FAILED');
    expect(body.errors[0]?.message).toContain('nope');
    expect(body.data ?? null).toBeNull();
  });

  test('missing required variable → error naming $code', { tag: '@api:country' }, async ({ countries }) => {
    const res = await countries.gql('query Country($code: ID!) { country(code: $code) { code } }');
    const body = expectSchema(res, GqlErrors);
    expect(body.errors[0]?.message).toContain('$code');
  });

  test('wrong variable type (object for ID) → error, no data', { tag: '@api:country' }, async ({ countries }) => {
    const res = await countries.gql('query Country($code: ID!) { country(code: $code) { code } }', { code: { x: 1 } });
    const body = expectSchema(res, GqlErrors);
    expect(body.errors[0]?.message).toMatch(/\$code/);
  });

  test('mutation on a read-only schema → rejected with errors', { tag: '@pattern:authz' }, async ({ countries }) => {
    const res = await countries.gql('mutation { __typename }');
    const body = expectSchema(res, GqlErrors);
    expect(body.errors[0]?.message).toMatch(/mutation/i);
  });
});
