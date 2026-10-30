# eslint-rules

- `require-level-tag` — every `test()` (incl. `.only/.skip/.fixme`) must carry an `@L<n>` tag (own or inherited from `describe`).
- `no-playwright-import-in-specs` — specs import `test` from the target `fixtures.ts`, not `@playwright/test`.
- `no-secret-literals` — no string literals assigned to password/secret/token/otp/ssn keys.
