import { expectSchema, expectStatus } from '../../../../src';
import { expect, test } from '../../fixtures';
import { Cart, Invoice } from '../../schemas';

const cents = (n: number) => Math.round(n * 100);

test(
  'cart → add → update qty → remove → invoice: invoice total equals Σ price × qty of what is left',
  {
    tag: [
      '@L3',
      '@api:createCart',
      '@api:addItem',
      '@api:updateCartQuantity',
      '@api:deleteProductFromCart',
      '@api:getCart',
      '@api:storeInvoice',
      '@api:getInvoice',
    ],
  },
  async ({ toolshop, newCart, newShopper, billingFor }) => {
    const [a, b, c] = await test.step('pick 3 in-stock products', async () => {
      const inStock = (await toolshop.getProducts()).body.data.filter((p) => p.in_stock && !p.is_rental);
      expect(inStock.length).toBeGreaterThanOrEqual(3);
      return inStock.slice(0, 3) as [(typeof inStock)[0], (typeof inStock)[0], (typeof inStock)[0]];
    });

    const cart = await test.step('createCart + addItem ×3', () =>
      newCart([
        { productId: a.id, quantity: 1 },
        { productId: b.id, quantity: 1 },
        { productId: c.id, quantity: 1 },
      ]));

    await test.step('updateCartQuantity a → 3, deleteProductFromCart c', async () => {
      expectStatus(await toolshop.updateCartQuantity(cart.id, a.id, 3), 200);
      expectStatus(await toolshop.deleteProductFromCart(cart.id, c.id), 204);
    });

    const expected = await test.step('getCart reflects both changes', async () => {
      const res = await toolshop.getCart(cart.id);
      expectStatus(res, 200);
      const items = expectSchema(res, Cart).cart_items;
      expect(Object.fromEntries(items.map((i) => [i.product_id, i.quantity]))).toEqual({ [a.id]: 3, [b.id]: 1 });
      return cents(a.price) * 3 + cents(b.price);
    });

    const shopper = await newShopper();

    const invoice = await test.step('storeInvoice for the cart', async () => {
      const res = await shopper.client.storeInvoice(await billingFor(cart.id));
      expectStatus(res, 201);
      return expectSchema(res, Invoice);
    });

    await test.step('invariant: invoice total = Σ price × qty, owned by the shopper', async () => {
      expect(cents(invoice.total)).toBe(expected);
      expect(invoice.user_id).toBe(shopper.id);
      const read = await shopper.client.getInvoice(invoice.id);
      expectStatus(read, 200);
      expect(read.body).toMatchObject({ id: invoice.id, invoice_number: invoice.invoice_number });
    });
  },
);
