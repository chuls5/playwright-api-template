# src — reusable core

Target-agnostic. Nothing here may name a specific system's host, operation, identity or env key. Import everything from `src/index.ts`.

| Folder        | Contents                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `auth/`       | `AuthStrategy` implementations + `TokenCache`                                                |
| `client/`     | `ApiClient` (redacted Allure attachments, one re-auth on 401), `FunctionClient`, `withRetry` |
| `assertions/` | `expectStatus`, `expectSchema` (Zod), `expectFasterThan`                                     |
| `data/`       | seeded `Rng`, banking factories, cleanup `Ledger`                                            |
| `fixtures/`   | base `test`: `rng`, `cleanup`, `ledger`                                                      |
| `config/`     | `.env` loading, `readEnv` (Zod-validated), `runId`                                           |
| `reporting/`  | `redact`, `attachJson`                                                                       |
