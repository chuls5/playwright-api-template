import { expectSchema, expectStatus } from '../../../../src';
import { expect, test } from '../../fixtures';
import { Cart } from '../../schemas';

test.describe('cart', { tag: '@L1' }, () => {
  test('POST /carts → 201 empty cart readable by id', { tag: ['@smoke', '@api:createCart', '@api:getCart'] }, async ({ toolshop, cleanup }) => {
    const res = await toolshop.createCart();
    expectStatus(res, 201);
    cleanup.add({ type: 'toolshop-cart', id: res.body.id }, () => toolshop.deleteCart(res.body.id));
    const cart = await toolshop.getCart(res.body.id);
    expectStatus(cart, 200);
    expect(expectSchema(cart, Cart).cart_items).toEqual([]);
  });

  test('POST /carts/{id} with product → 200 item in cart', { tag: '@api:addItem' }, async ({ toolshop, newCart }) => {
    const product = (await toolshop.getProducts()).body.data.find((p) => p.in_stock)!;
    const cart = await newCart();
    expectStatus(await toolshop.addItem(cart.id, product.id, 2), 200);
    const items = (await toolshop.getCart(cart.id)).body.cart_items;
    expect(items).toEqual([expect.objectContaining({ product_id: product.id, quantity: 2 })]);
  });

  test('PUT /carts/{id}/product/quantity → 200 quantity replaced', { tag: '@api:updateCartQuantity' }, async ({ toolshop, newCart }) => {
    const product = (await toolshop.getProducts()).body.data.find((p) => p.in_stock)!;
    const cart = await newCart([{ productId: product.id, quantity: 1 }]);
    expectStatus(await toolshop.updateCartQuantity(cart.id, product.id, 5), 200);
    expect((await toolshop.getCart(cart.id)).body.cart_items[0]?.quantity).toBe(5);
  });

  test('DELETE /carts/{id}/product/{productId} → 204 item removed', { tag: '@api:deleteProductFromCart' }, async ({ toolshop, newCart }) => {
    const product = (await toolshop.getProducts()).body.data.find((p) => p.in_stock)!;
    const cart = await newCart([{ productId: product.id, quantity: 1 }]);
    expectStatus(await toolshop.deleteProductFromCart(cart.id, product.id), 204);
    expect((await toolshop.getCart(cart.id)).body.cart_items).toEqual([]);
  });

  test('DELETE /carts/{id} → 204 then GET → 404', { tag: '@api:deleteCart' }, async ({ toolshop }) => {
    const id = (await toolshop.createCart()).body.id;
    expectStatus(await toolshop.deleteCart(id), 204);
    expectStatus(await toolshop.getCart(id), 404);
  });
});
