# Standards

Enforced by `npm run lint` (ESLint flat config, `typescript-eslint`, `eslint-plugin-playwright`, local rules in `tools/eslint-rules/`) and `npm run typecheck` (TS strict, `noUncheckedIndexedAccess`).

## Layering

- `src/` is target-agnostic. No hostnames, function names, roles or env keys of a specific system. If you need one, it belongs in `targets/<id>/`.
- `targets/<id>/` = `config.ts` (env schema) · `identities.ts` / auth wiring · `client.ts` or FunctionClient use · `schemas.ts` (Zod) · `fixtures.ts` · `tests/L<n>-*/` · `spec/` (pinned contracts) · `map/` (generated catalog, graph, coverage).
- Specs import `test`/`expect` from their target's `fixtures.ts` (**lint: `local/no-playwright-import-in-specs`**). Setup files (`*.setup.ts`) may use `@playwright/test` directly.

## Tests

- File: `<area>.L<n>.spec.ts` under `tests/L<n>-<name>/`. The level in the file name drives `tools/coverage.ts`.
- Title: `<METHOD path | Function> <condition> → <expected>`, e.g. `POST /pet with malformed JSON → 400`.
- Tags (Playwright `tag` option): one level `@L0`–`@L4` (**lint: `local/require-level-tag`**), `@api:<operationId | Function.vN>`, optional `@smoke`, `@pattern:<name>`.
- Assert status **and** body (and side effect for writes). Use `expectStatus`, `expectSchema`, `expectFasterThan` — failures print status, correlation id and body.
- No `waitForTimeout` (use `expect.poll`), no `test.only`, no unconditional `test.skip` (**lint**). A known product bug is `test.fail()` with the ticket id in the title.
- No hidden retries. `retries` is 0 locally, 1 in CI (reported as flaky by Allure). Product-level retry is opt-in per call via `withRetry`.
- Every created entity goes through a fixture that registers `cleanup.add` (or `cleanup.leave` with a reason).

## Secrets

- Values live in `.env` / CI credentials only. `.env.example` lists key names.
- **lint: `local/no-secret-literals`** rejects string literals on keys like `password`, `secret`, `otp`, `token`.
- Allure attachments are redacted by `src/reporting/redact.ts` (Authorization, cookies, signatures, SSN, OTP, passwords; account/card numbers masked to last 4).

## Code

- No `any`; `consistent-type-imports`; no floating promises; no `console` outside `mock/` and `tools/`.
- Prettier: single quotes, width 160.
