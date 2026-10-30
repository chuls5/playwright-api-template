# Account holds (Create/Read/Delete .v1) — L2

Sources: mock handler + probe 2026-10-30 (service domain `servicing`), role/scope model in identities.ts. No real contract: every expected code is a **mock assumption** to re-check against the real platform's contract.

| title                                                             | data                       | expected                       | tags                                               |
| ----------------------------------------------------------------- | -------------------------- | ------------------------------ | -------------------------------------------------- |
| `Create with unknown accountId → 404 ACCOUNT_NOT_FOUND`           | random uuid                | 404, body.code                 | @L2 @api:CreateAccountHold.v1 @pattern:validation  |
| `Create with code outside enum → 400 INVALID_CODE`                | newCustomer(), code `THAW` | 400, body.code, nothing stored | @L2 @api:CreateAccountHold.v1 @pattern:validation  |
| `Delete unknown restrictionId → 404 RESTRICTION_NOT_FOUND`        | random uuid                | 404, body.code                 | @L2 @api:DeleteAccountHold.v1 @pattern:validation  |
| `Delete twice → 204 then 404`                                     | created restriction        | 204, 404                       | @L2 @api:DeleteAccountHold.v1 @pattern:idempotency |
| `Read for unknown accountId → 200 empty list (mock)`              | random uuid                | 200, `restrictions: []`        | @L2 @api:ReadAccountHolds.v1 @pattern:validation   |
| `Create with core-domain token lacking scope → 403 SCOPE_MISSING` | fnAs('core')               | 403, body.code                 | @L2 @api:CreateAccountHold.v1 @pattern:authz       |

Dropped: missing `code` (same path as invalid enum); 401/400-header cases (covered for every function in L1/L0).
