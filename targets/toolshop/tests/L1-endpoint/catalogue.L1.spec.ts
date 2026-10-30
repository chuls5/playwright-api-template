import { expectSchema, expectStatus } from '../../../../src';
import { expect, test } from '../../fixtures';
import { Address, Brand, Category, Product, ProductPage } from '../../schemas';

test.describe('catalogue', { tag: '@L1' }, () => {
  test('GET /products → 200 first page of the paginator', { tag: ['@smoke', '@api:getProducts'] }, async ({ toolshop }) => {
    const res = await toolshop.getProducts();
    expectStatus(res, 200);
    const p = expectSchema(res, ProductPage);
    expect(p.current_page).toBe(1);
    expect(p.data).toHaveLength(Math.min(p.per_page, p.total));
  });

  test('GET /products/{id} → 200 same product as in the list', { tag: '@api:getProduct' }, async ({ toolshop }) => {
    const first = (await toolshop.getProducts()).body.data[0]!;
    const res = await toolshop.getProduct(first.id);
    expectStatus(res, 200);
    expect(expectSchema(res, Product)).toMatchObject({ id: first.id, name: first.name, price: first.price });
  });

  test('GET /products/search?q=<name> → 200 contains that product', { tag: '@api:searchProduct' }, async ({ toolshop }) => {
    const first = (await toolshop.getProducts()).body.data[0]!;
    const res = await toolshop.searchProduct(first.name);
    expectStatus(res, 200);
    expect(res.body.data.map((p) => p.id)).toContain(first.id);
  });

  test('GET /brands → 200 list of brands', { tag: '@api:getBrands' }, async ({ toolshop }) => {
    const res = await toolshop.getBrands();
    expectStatus(res, 200);
    expect(Brand.array().min(1).parse(res.body)).toBeTruthy();
  });

  test('GET /categories → 200 list of categories', { tag: '@api:getCategories' }, async ({ toolshop }) => {
    const res = await toolshop.getCategories();
    expectStatus(res, 200);
    expect(Category.array().min(1).parse(res.body)).toBeTruthy();
  });

  test('GET /postcode-lookup NL 1012AB → 200 address for that postcode', { tag: '@api:postcodeLookup' }, async ({ toolshop }) => {
    const res = await toolshop.postcodeLookup('NL', '1012AB');
    expectStatus(res, 200);
    expect(expectSchema(res, Address)).toMatchObject({ country: 'NL', postcode: '1012AB' });
  });
});
