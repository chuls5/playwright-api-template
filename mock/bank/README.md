# mock/bank

`server.ts` — one-file HTTP server on `127.0.0.1:4010` (`MOCK_PORT`). Run alone: `npm run mock`. Playwright starts it automatically.
Implements: `/auth/service-token` (HMAC v2 service, scopes), `/auth/login` + `/authentication/token/v3` + `/otp/delivery/v3` (user step-up; v2/v1 challenge paths), `/applications`, `/applications`, versioned function calls, Idempotency-Key replay, role authz, limits, business days, fault injection header, `/health`, `/__kat`, `/__admin/revoke-tokens`.
All identities and secrets are generated fakes. In-memory state, reset on restart.
