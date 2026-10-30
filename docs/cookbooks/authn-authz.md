# AuthN / AuthZ

| Case                                                                         | Expected                                                                                |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Missing / malformed / expired token                                          | 401 (client re-auths once on 401 and records a `reauth` annotation; a second 401 fails) |
| Bad HMAC signature, stale timestamp, unknown app                             | 401 with distinct code                                                                  |
| service scope not in the identity's allowlist (token request)                | 403                                                                                     |
| Token without the function's scope (call)                                    | 403                                                                                     |
| User without step-up calling money movement                                  | 403 STEP_UP_REQUIRED                                                                    |
| Wrong OTP / wrong password                                                   | 401 at the step that failed                                                             |
| Role matrix: each role × each capability (read, statement, servicing, money) | allowed → 2xx; denied → 403                                                             |
| BOLA: valid user, someone else's resource id                                 | 403 or 404, never 200                                                                   |

**How:** data-driven matrix in one spec (`targets/mock-bank/tests/L2-pattern/authz-roles.L2.spec.ts`). Create one customer with all roles per case. Mark any row that is an assumption (POA here) in a comment.
**Signers:** lock with a known-answer vector computed by an independent implementation (`/__kat` in the mock).
