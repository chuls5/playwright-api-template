import { expectSchema, expectStatus } from '../../../../src';
import { expect, test } from '../../fixtures';
import { Brand } from '../../schemas';

test.describe('getBrand', { tag: ['@L1', '@api:getBrand'] }, () => {
  test('GET /brands/{id} for a listed brand → 200 same brand', async ({ toolshop }) => {
    const listed = Brand.parse((await toolshop.getBrands()).body?.[0]);
    const res = await toolshop.getBrand(listed.id);
    expectStatus(res, 200);
    expect(expectSchema(res, Brand)).toEqual(listed);
  });
});
