# New target, day 1 — when access and test credentials arrive

Goal for the day: one real operation of the system under test (SUT) at L1/L2 in its test environment, green 3×. Pick the simplest read-only operation (a business-day or reference-data lookup is ideal). Nothing merges to `develop` until it's reviewed.

Below, `<target>` is the new folder name (e.g. `acme-payments`) and `<PREFIX>` its env-key prefix (e.g. `ACME_`).

## 0. Branch

`git checkout develop && git checkout -b feature/<target>-first-operation`. Conventional Commits.

## 1. Config / env (values never in the repo)

1. `cp -n .env.example .env`. Add the target's key **names** to `.env.example` (e.g. `<PREFIX>BASE_URL`, `<PREFIX>TOKEN_URL`, `<PREFIX>CLIENT_ID`, `<PREFIX>SECRET`, `<PREFIX>USER_PASSWORD`, `<PREFIX>TEST_OTP`) and the values to `.env` only — from the team's secret store locally, CI credentials in pipelines.
2. Any further keys the SUT needs (per-domain client ids/secrets, challenge URLs): name in `.env.example`, value in `.env` only.
3. `git status` must show no `.env*` other than `.env.example`. Secrets are never logged (reporter/ledger print key names only).

## 2. Signer known-answer check (if the SUT signs token requests)

1. Get one fixed input/output of the real signer (client id, secret, timestamp → expected signature) from the SUT's docs or an existing client, or compute it once with an independent implementation.
2. Store it as env (`<PREFIX>KAT_*` keys), not as literals in a spec.
3. Add `targets/<target>/tests/L0-auth/service-token.L0.spec.ts`, modelled on the mock's: `hmacV2Signature(...)` (or your custom signer) must equal the vector.
4. If it differs, stop and fix the signer (`src/auth/hmac-service.ts`, or pass a custom `signer`). Everything else depends on it.

## 3. L0 auth per domain/role

1. Copy `templates/target/*.tmpl` into `targets/<target>/` without the `.tmpl` suffix (keep the README TODOs). Fill in `config.ts` (Zod-validated env), `identities.ts` (domains → client id/secret keys and scopes, roles → users) and `health.setup.ts`. Add `<target>-setup` and `<target>` projects to `playwright.config.ts`.
2. One L0 test per service identity (token minted for its scopes) and per user role (login + OTP step-up, if the SUT has it). Confirm challenge versions and any test-OTP mechanism.
3. `npx playwright test --project=<target> --grep @L0` passes before any L1 work.

## 4. Discovery from the contract

1. Get the contract read-only (OpenAPI file, schema repo, or API portal export).
2. If it is OpenAPI (or fragments you can bundle, e.g. `npx @redocly/cli bundle`, no install into the repo), save it as `targets/<target>/spec/openapi.json` and run `npm run discover <target>`.
3. If not, write `map/catalog.json` by hand for the first domain only, using DTOs and call sites in any existing client code as the source.
4. Add body-field dependencies to `map/edges.manual.json`.

## 5. First operation

1. Plan: api-test-plan skill → `targets/<target>/plans/<Operation>.L1.md` and `.L2.md`.
   - Probe once first.
   - Reuse the mock's cases (weekend, holiday, invalid date, …) only where the contract confirms them.
2. Spec: write-api-spec skill (W2). Run `--grep "@api:<Operation>"` (≤5 iterations), then `--repeat-each=3`, `npm run coverage`, `npm run check`.
3. Record latency (it sets `WORKERS`/shards) and anything the skills got wrong in `docs/workflows/W5-calibration.md`. Tick the target README TODOs.

## 6. Notes on any existing suite

If the SUT already has an automated suite, read it before writing tests and keep a short, shareable findings note (in your own notes, not this repo). Common things worth checking:

1. **Idempotency key per retry:** is the key generated inside the retried call? Then each retry sends a new key and can create duplicates.
2. **Retry exhaustion:** does the last attempt return null/undefined so tests fail later with an unclear error? Is backoff applied on every branch?
3. **Shared random generators across threads:** generated data can collide between parallel tests.
4. **Invalid synthetic identifiers:** e.g. SSN area numbers 000, 666 and 9xx are invalid; validation-sensitive endpoints may reject them.
5. **Disabled assertions:** commented-out role checks (often the less common roles) mean that permission intent is untested; confirm it with the product owner.
