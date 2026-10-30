# toolshop

[Practice Software Testing](https://practicesoftwaretesting.com) REST API (`TOOLSHOP_BASE_URL`, default `https://api.practicesoftwaretesting.com/`): JWT roles, paginated catalogue, cart → invoice checkout. Public and shared. Run: `npm run test:toolshop`.

- Roles: `as('admin' | 'customer' | 'customer2')` log in with the vendor's published demo accounts (config/env `TOOLSHOP_*`), 5-min JWT cached per worker. Demo accounts are read-only here; anything that writes (checkout, invoices) uses `newShopper()`, a freshly registered customer.
- Cleanup: carts deleted; shoppers deleted by admin, except those owning invoices: the vendor refuses (409 "used elsewhere"), so the ledger records them `left`.
- Gotchas found: validation errors are 422 JSON **only with `Accept: application/json`** (else 302 to HTML; `ApiClient` sends it). Invoice billing city/state must match `GET /postcode-lookup` for the postcode (faker-generated, changes) — `billingFor()` reads it. Register requires age 18–75.
- Known flakiness: ~0.5–1 s per call, so the project timeout is 45 s.
