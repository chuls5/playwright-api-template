import { ApiClient, bearerToken, dob, markEnvUnavailable, personName, test as base, TokenCache, type Rng } from '../../src';
import { ToolshopClient, type InvoiceRequest } from './client';
import { cfg, emailFor, type Role } from './config';
import type { Cart } from './schemas';

export interface Shopper {
  id: string;
  email: string;
  password: string;
  /** Client authenticated as this shopper (login on first use, token cached per test). */
  client: ToolshopClient;
}

interface Fixtures {
  /** Anonymous client (public catalogue, carts, login). */
  toolshop: ToolshopClient;
  /** Client authenticated as one of the vendor's demo accounts. Read-mostly: never mutate their profile. */
  as: (role: Role) => ToolshopClient;
  /** Registers a fresh customer; the admin deletes it afterwards. Users that own invoices can't be deleted (409): ledger `left`. */
  newShopper: () => Promise<Shopper>;
  /** Creates an empty cart, deleted afterwards (404 = already consumed by checkout, fine). */
  newCart: (items?: { productId: string; quantity: number }[]) => Promise<Cart>;
  /** Billing address that passes the server's postcode ↔ city/state check: looked up, never hard-coded. */
  billingFor: (cartId: string) => Promise<InvoiceRequest>;
  /** Auto: after a failure, checks whether the shared demo was reset/down and marks the test env-unavailable. */
  envProbe: void;
}
interface WorkerFixtures {
  /** Demo-account tokens shared per worker (5 min JWT; the cache refreshes 1 min early). */
  demoTokens: TokenCache;
}

/** Valid POST /users/register body from the test's seed (server rules: age 18–75, strong password, unique email). */
export const registration = (rng: Rng) => {
  const name = personName(rng);
  return {
    first_name: name.first,
    last_name: name.last,
    email: `poc-${rng.letters(10)}@example.test`,
    password: `Pw${rng.letters(6)}!${rng.digits(3)}Q`,
    dob: dob(rng, { minAge: 18, maxAge: 75 }),
    phone: `06${rng.digits(8)}`,
    address: { street: 'Teststraat 1', city: 'Amsterdam', state: 'Noord-Holland', country: 'NL', postal_code: '1012AB' },
  };
};

const login = async (request: ConstructorParameters<typeof ApiClient>[0], email: string, pw: string) => {
  const res = await new ToolshopClient(new ApiClient(request)).login(email, pw);
  if (res.status !== 200) throw new Error(`setup: login failed for ${email} HTTP ${res.status}`);
  return { value: res.body.access_token, expiresAt: Date.now() + res.body.expires_in * 1000 };
};

export const test = base.extend<Fixtures, WorkerFixtures>({
  demoTokens: [async ({}, use) => use(new TokenCache(240_000)), { scope: 'worker' }],
  envProbe: [
    async ({ toolshop, as }, use, info) => {
      await use();
      if (info.status === info.expectedStatus) return;
      // The demo DB resets periodically: catalogue 5xx while it rebuilds, then cached demo tokens are rejected.
      const products = await toolshop.getProducts();
      if (products.status >= 500) return markEnvUnavailable(info, `toolshop products HTTP ${products.status} after failure`);
      try {
        const me = await as('customer').me();
        if (me.status === 401) await markEnvUnavailable(info, 'toolshop cached demo token rejected (DB reset mid-run)');
      } catch (e) {
        await markEnvUnavailable(info, `toolshop demo login failed after failure: ${String(e)}`);
      }
    },
    { auto: true },
  ],
  toolshop: async ({ request }, use) => use(new ToolshopClient(new ApiClient(request))),
  as: async ({ request, demoTokens }, use) => {
    await use(
      (role) =>
        new ToolshopClient(
          new ApiClient(request, {
            auth: bearerToken({ identity: role, cache: demoTokens, login: () => login(request, emailFor(role), cfg.TOOLSHOP_DEMO_PASSWORD) }),
          }),
        ),
    );
  },
  newShopper: async ({ request, toolshop, as, rng, cleanup }, use) => {
    const cache = new TokenCache(240_000);
    await use(async () => {
      const body = registration(rng);
      const res = await toolshop.storeUser(body);
      if (res.status !== 201) throw new Error(`setup: register failed HTTP ${res.status}`);
      const id = res.body.id;
      cleanup.add({ type: 'toolshop-user', id }, async () => {
        const del = await as('admin').deleteUser(id);
        if (del.status === 409) return 'left' as const; // vendor keeps users that own invoices ("used elsewhere")
        if (del.status !== 204) throw new Error(`deleteUser HTTP ${del.status}`);
      });
      const client = new ToolshopClient(
        new ApiClient(request, { auth: bearerToken({ identity: body.email, cache, login: () => login(request, body.email, body.password) }) }),
      );
      return { id, email: body.email, password: body.password, client };
    });
  },
  newCart: async ({ toolshop, cleanup }, use) => {
    await use(async (items = []) => {
      const res = await toolshop.createCart();
      if (res.status !== 201) throw new Error(`setup: createCart failed HTTP ${res.status}`);
      const id = res.body.id;
      cleanup.add({ type: 'toolshop-cart', id }, async () => {
        const del = await toolshop.deleteCart(id);
        if (del.status !== 204 && del.status !== 404) throw new Error(`deleteCart HTTP ${del.status}`);
      });
      for (const i of items) {
        const add = await toolshop.addItem(id, i.productId, i.quantity);
        if (add.status !== 200) throw new Error(`setup: addItem failed HTTP ${add.status}`);
      }
      return (await toolshop.getCart(id)).body;
    });
  },
  billingFor: async ({ toolshop }, use) => {
    await use(async (cartId) => {
      const res = await toolshop.postcodeLookup('NL', '1012AB');
      if (res.status !== 200) throw new Error(`setup: postcode lookup failed HTTP ${res.status}`);
      const a = res.body;
      return {
        billing_street: a.street,
        billing_city: a.city,
        billing_state: a.state,
        billing_country: a.country,
        billing_postal_code: a.postcode,
        payment_method: 'cash-on-delivery',
        payment_details: {},
        cart_id: cartId,
      };
    });
  },
});
export { expect } from '../../src';
