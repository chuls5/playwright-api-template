---
name: api-client-gen
description: Add typed client methods for a target. Use when a spec needs an op the client lacks.
---

- REST: one method per operationId in `targets/<t>/client.ts`, returning `this.api.<verb><T>(path, opts)`. No assertions, no retries, no data creation.
- function-API-style: no client file — use `FunctionClient.call(fn, body, opts)` from fixtures.
- Auth is never in the client: pick an `AuthStrategy` in fixtures (`bearerToken`, `hmacService`, `userSessionMfa`, `oauth2ClientCredentials`).
- Expose `raw()` for negative tests that need malformed bodies.
  Example: `targets/petstore/client.ts`.
