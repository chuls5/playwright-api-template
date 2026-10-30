# auth

Every strategy implements `AuthStrategy { id, headers(), invalidate() }`; `ApiClient` calls `invalidate()` and retries once on 401.

| File                  | Strategy                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| `hmac-service.ts`     | `hmacService` — app token via HMAC v2 signed request; pluggable `Signer`; scopes per app               |
| `user-session-mfa.ts` | `userSessionMfa` — logon → challenge (v3→v2→v1 fallback) → OTP/SSN answer → user token                 |
| `otp.ts`              | `OtpProvider`s: `staticOtp`, `overrideOtp`, `ssnStepUp`                                                |
| `oauth2-cc.ts`        | `oauth2ClientCredentials`                                                                              |
| `bearer.ts`           | `bearerToken` — static token                                                                           |
| `token-cache.ts`      | in-memory cache with expiry skew; one per worker (service) or per test (users). Not persisted to disk. |
