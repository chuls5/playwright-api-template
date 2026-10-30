import { expectStatus } from '../../../../src';
import { expect, test } from '../../fixtures';

test.describe('role-based access', { tag: ['@L2', '@pattern:authz'] }, () => {
  test('GET /users: admin 200, customer 403, anonymous 401', { tag: '@api:getUsers' }, async ({ toolshop, as }) => {
    expectStatus(await as('admin').getUsers(), 200);
    expectStatus(await as('customer').getUsers(), 403);
    expectStatus(await toolshop.getUsers(), 401);
  });

  test('GET /invoices anonymous → 401', { tag: '@api:getInvoices' }, async ({ toolshop }) => {
    expectStatus(await toolshop.getInvoices(), 401);
  });

  test("customer cannot read another customer's invoice (BOLA → 404); admin can", { tag: '@api:getInvoice' }, async ({ as }) => {
    const theirs = (await as('customer2').getInvoices()).body.data[0];
    test.skip(!theirs, 'customer2 demo account has no invoices on this environment');
    expectStatus(await as('customer2').getInvoice(theirs!.id), 200);
    const peek = await as('customer').getInvoice(theirs!.id);
    expectStatus(peek, 404);
    expect(JSON.stringify(peek.body)).not.toContain(theirs!.invoice_number);
    expectStatus(await as('admin').getInvoice(theirs!.id), 200);
  });
});
