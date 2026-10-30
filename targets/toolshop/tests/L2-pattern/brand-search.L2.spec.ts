import { expectStatus } from '../../../../src';
import { expect, test } from '../../fixtures';
import { Brand } from '../../schemas';

test.describe('searchBrand validation', { tag: ['@L2', '@api:searchBrand', '@pattern:validation'] }, () => {
  test('GET /brands/search?q=<no match> → 200 empty list', async ({ toolshop, rng }) => {
    const res = await toolshop.searchBrand(rng.letters(12));
    expectStatus(res, 200);
    expect(res.body).toEqual([]);
  });

  test('GET /brands/search without q → 200 (not enforced) same as list', async ({ toolshop }) => {
    const all = Brand.array()
      .parse((await toolshop.getBrands()).body)
      .map((b) => b.id);
    const res = await toolshop.searchBrand();
    expectStatus(res, 200);
    expect(
      Brand.array()
        .parse(res.body)
        .map((b) => b.id),
    ).toEqual(expect.arrayContaining(all));
  });
});
