import { expectSchema, expectStatus } from '../../../../src';
import { expect, test } from '../../fixtures';
import { Brand } from '../../schemas';

test.describe('searchBrand', { tag: ['@L1', '@api:searchBrand'] }, () => {
  test('GET /brands/search?q=<upper-cased fragment> → 200 contains that brand', async ({ toolshop }) => {
    const listed = Brand.parse((await toolshop.getBrands()).body?.[0]);
    const res = await toolshop.searchBrand(listed.name.slice(0, 4).toUpperCase());
    expectStatus(res, 200);
    expect(expectSchema(res, Brand.array())).toContainEqual(listed);
  });
});
