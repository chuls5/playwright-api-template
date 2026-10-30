import { expectSchema, expectStatus } from '../../../../src';
import { expect, test } from '../../fixtures';
import { Invoice, InvoicePage, ProductPage } from '../../schemas';

test(
  'new customer: register → login → browse pages → cart → checkout → invoice listed; other customers cannot see it',
  {
    tag: [
      '@L4',
      '@api:storeUser',
      '@api:login-customer',
      '@api:getProducts',
      '@api:createCart',
      '@api:addItem',
      '@api:postcodeLookup',
      '@api:storeInvoice',
      '@api:getInvoices',
      '@api:getInvoice',
    ],
  },
  async ({ toolshop, newShopper, newCart, billingFor, as }) => {
    const shopper = await test.step('register + login', async () => {
      const s = await newShopper();
      expectStatus(await s.client.me(), 200); // first call logs in
      return s;
    });

    const picks = await test.step('browse: cheapest in-stock item on page 1, priciest on the last page (price asc)', async () => {
      const first = expectSchema(await toolshop.getProducts({ sort: 'price,asc', page: 1 }), ProductPage);
      const last = expectSchema(await toolshop.getProducts({ sort: 'price,asc', page: first.last_page }), ProductPage);
      const cheap = first.data.find((p) => p.in_stock && !p.is_rental);
      const dear = [...last.data].reverse().find((p) => p.in_stock && !p.is_rental);
      expect(cheap && dear, 'need an in-stock product on the first and last page').toBeTruthy();
      expect(dear!.price).toBeGreaterThanOrEqual(cheap!.price);
      return [
        { product: cheap!, quantity: 2 },
        { product: dear!, quantity: 1 },
      ];
    });

    const cart = await test.step('cart with both picks', () => newCart(picks.map((p) => ({ productId: p.product.id, quantity: p.quantity }))));

    const invoice = await test.step('checkout: billing from postcode lookup, cash on delivery', async () => {
      const res = await shopper.client.storeInvoice(await billingFor(cart.id));
      expectStatus(res, 201);
      const inv = expectSchema(res, Invoice);
      const expected = picks.reduce((s, p) => s + Math.round(p.product.price * 100) * p.quantity, 0);
      expect(Math.round(inv.total * 100)).toBe(expected);
      return inv;
    });

    await test.step('invoice appears in the shopper’s list and detail', async () => {
      const list = expectSchema(await shopper.client.getInvoices(), InvoicePage);
      expect(list.data.map((i) => i.id)).toEqual([invoice.id]); // fresh account: exactly one
      expectStatus(await shopper.client.getInvoice(invoice.id), 200);
    });

    await test.step('isolation: another customer gets 404, admin gets 200', async () => {
      const other = await newShopper();
      expectStatus(await other.client.getInvoice(invoice.id), 404);
      expect((await other.client.getInvoices()).body.data).toEqual([]);
      expectStatus(await as('admin').getInvoice(invoice.id), 200);
    });
  },
);
