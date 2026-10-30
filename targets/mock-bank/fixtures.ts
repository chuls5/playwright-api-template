import { randomUUID } from 'node:crypto';
import { ApiClient, FunctionClient, ssn, test as base, TokenCache, type AuthStrategy, type FunctionId } from '../../src';
import { cfg } from './config';
import { service, user, type Domain, type Role } from './identities';

export interface Account {
  accountId: string;
  customerId: string;
  balanceMinor: number;
}
export interface Customer {
  applicationId: string;
  customerId: string;
  ssn: string;
  users: { userId: string; role: Role }[];
  accounts: Account[];
  /** First user with the role; throws if the customer was created without it. */
  userFor(role: Role): { userId: string; role: Role };
}

interface Fixtures {
  /** function-API function client as an service domain identity. */
  fnAs: (domain: Domain) => FunctionClient;
  /** function-API function client as a user (logon + OTP step-up), identity headers set from the user. */
  fnAsUser: (u: { userId: string; role: string }, auth?: AuthStrategy) => FunctionClient;
  /** Raw client with no auth; for token endpoints and negative tests. */
  raw: ApiClient;
  /** Onboards a fresh customer (PRIMARY + extra stakeholders, 2 accounts). Deleted after the test. */
  newCustomer: (o?: { stakeholders?: Role[]; openingDepositMinor?: number }) => Promise<Customer>;
  userCache: TokenCache;
}
interface WorkerFixtures {
  /** service tokens are shared per worker: same identity + scopes → one token (like the real suite). */
  appCache: TokenCache;
}

const path = (fn: FunctionId) => `/api/functions/${fn}`;
const SERVICE_USER = { userId: 'svc-poc', role: 'SYSTEM' };

export const test = base.extend<Fixtures, WorkerFixtures>({
  appCache: [async ({}, use) => use(new TokenCache(cfg.MOCK_BANK_TOKEN_TTL_MS)), { scope: 'worker' }],
  // User tokens are per test: users are created per test, so nothing to share.
  userCache: async ({}, use) => use(new TokenCache(cfg.MOCK_BANK_TOKEN_TTL_MS)),
  raw: async ({ request }, use) => use(new ApiClient(request)),

  fnAs: async ({ request, appCache }, use) => {
    await use(
      (domain) =>
        new FunctionClient(
          new ApiClient(request, { auth: service(domain, appCache), headers: identityHeaders(SERVICE_USER), correlationHeader: 'x-correlation-id' }),
          path,
        ),
    );
  },

  fnAsUser: async ({ request, userCache }, use) => {
    await use(
      (u, auth) =>
        new FunctionClient(
          new ApiClient(request, { auth: auth ?? user(u, userCache), headers: identityHeaders(u), correlationHeader: 'x-correlation-id' }),
          path,
        ),
    );
  },

  newCustomer: async ({ request, appCache, rng, cleanup }, use) => {
    const onboarding = new ApiClient(request, { auth: service('onboarding', appCache) });
    await use(async (o = {}) => {
      const primarySsn = ssn(rng);
      const res = await onboarding.post<Omit<Customer, 'ssn' | 'userFor'>>('/applications', {
        data: { ssn: primarySsn, stakeholders: o.stakeholders ?? [], openingDepositMinor: o.openingDepositMinor ?? 100_000 },
      });
      if (res.status !== 201) throw new Error(`setup: onboarding failed HTTP ${res.status}: ${res.text}`);
      const c = res.body;
      cleanup.add({ type: 'application', id: c.applicationId }, () => onboarding.delete(`/applications/${c.applicationId}`));
      return {
        ...c,
        ssn: primarySsn,
        userFor(role: Role) {
          const found = c.users.find((x) => x.role === role);
          if (!found) throw new Error(`customer has no ${role}`);
          return found;
        },
      };
    });
  },
});

function identityHeaders(u: { userId: string; role: string }) {
  return () => ({ 'x-correlation-id': randomUUID(), 'x-user-id': u.userId, 'x-user-role': u.role });
}

export { expect } from '../../src';
