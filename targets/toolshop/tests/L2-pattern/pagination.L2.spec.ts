import { expectSchema, expectStatus } from '../../../../src';
import { expect, test } from '../../fixtures';
import { ProductPage } from '../../schemas';

test.describe('products paginator', { tag: ['@L2', '@pattern:pagination', '@api:getProducts'] }, () => {
  test('pages are disjoint, sized per_page, and add up to total', async ({ toolshop }) => {
    const first = expectSchema(await toolshop.getProducts({ page: 1 }), ProductPage);
    const seen = new Set<string>();
    for (let n = 1; n <= first.last_page; n++) {
      const p = expectSchema(await toolshop.getProducts({ page: n }), ProductPage);
      expect(p.current_page).toBe(n);
      if (n < p.last_page) expect(p.data).toHaveLength(p.per_page);
      for (const item of p.data) {
        expect(seen.has(item.id), `product ${item.id} repeated on page ${n}`).toBe(false);
        seen.add(item.id);
      }
    }
    expect(seen.size).toBe(first.total);
  });

  test('page beyond last_page → 200 with empty data', async ({ toolshop }) => {
    const { last_page } = (await toolshop.getProducts()).body;
    const res = await toolshop.getProducts({ page: last_page + 1 });
    expectStatus(res, 200);
    expect(expectSchema(res, ProductPage).data).toEqual([]);
  });

  test('sort=price,asc orders within and across pages', async ({ toolshop }) => {
    const p1 = expectSchema(await toolshop.getProducts({ sort: 'price,asc', page: 1 }), ProductPage);
    const p2 = expectSchema(await toolshop.getProducts({ sort: 'price,asc', page: 2 }), ProductPage);
    const prices = [...p1.data, ...p2.data].map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});
