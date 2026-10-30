# mock-bank

Tests against `mock/bank` (started by Playwright's `webServer`). Proves the auth strategies, role matrix and banking patterns before you have access to a real platform. **Mock behaviour is a design aid, not evidence of any real platform's behaviour.**

- `config.ts` — `MOCK_BANK_*` env keys; defaults are the mock's fake identities.
- `identities.ts` — domains, roles, challenge endpoints; `service(domain)`, `user(role)` builders.
- `fixtures.ts` — `fnAs(domain)` (service), `fnAsUser(user)`, `raw`, `newCustomer({stakeholders, openingDepositMinor})` → `userFor(role)`.
  Run: `npm run test:mock`. `/__admin/revoke-tokens` clears **all** tokens; safe with 1 worker (tests re-auth), revisit before raising `WORKERS`.
