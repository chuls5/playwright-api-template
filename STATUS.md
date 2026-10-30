# STATUS — 2026-10-30

## Included

- Core (`src/`): auth (bearer, OAuth2 CC, HMAC service token v2, user login + OTP/SSN step-up with challenge v3 → v2 → v1 fallback), `ApiClient`, `FunctionClient`, assertions, seeded RNG + banking factories, cleanup + ledger fixtures.
- Targets: `mock-bank` (local mock, L0–L2), `petstore` (public REST, L0–L2), `toolshop` (public demo shop with JWT roles, L0–L4), `countries` (public GraphQL, L1–L2).
- Agents, 13 skills, cookbooks, spec + target templates, workflows W1–W5 + definition of done, discovery + coverage tools.
- Allure: categories (Environment / infra → Test defect → Product defect, from `reporting/categories.json`), environment.properties (no secrets), executor.json, target › level › op suite tree.
- Health prechecks per target fail with `env-unavailable:` so environment problems are filed as Environment, not as defects.

## Not included / known limits

- No L3/L4 on petstore or mock-bank; `countries` has no map/coverage (no OpenAPI).
- No token persistence to `.auth/` (mock tokens die with the per-run mock; it would also put bearer tokens on disk).
- Playwright `retries: 1` on CI; flaky results show as `flaky` in Allure. Set `0` for strict no-retry.
- CI is GitHub Actions (`docs/ci.md`): PR gate, nightly regression with the Allure report on GitHub Pages, reusable `api-tests.yml`. Jenkinsfile kept as legacy reference.
- Mock behaviour (incl. POWER_OF_ATTORNEY = read-only) is a design assumption, not any real platform's behaviour.

## Counts

Tests per level (setup health check excluded; from `--list --grep @L<n>`):

| Target    | L0  | L1  | L2  | L3  | L4  | Tests incl. setup | Ops at L1+  |
| --------- | --- | --- | --- | --- | --- | ----------------- | ----------- |
| petstore  | 2   | 8   | 10  | 0   | 0   | 21                | 8 / 19      |
| mock-bank | 16  | 8   | 48  | 0   | 0   | 73                | 11 / 15     |
| toolshop  | 7   | 13  | 16  | 1   | 1   | 39                | 20 / 81     |
| countries | 0   | 3   | 5   | 0   | 0   | 9                 | — (GraphQL) |
| **total** |     |     |     |     |     | **142**           |             |

Last full run (Node 24, 1 worker, 2026-10-30): 142 passed, ~1.9 min. `npm run check` and `prettier --check` clean.

## Commands

```bash
npm ci && cp -n .env.example .env && npm run hooks:install   # blank keys = config defaults
npm test | npm run test:mock | npm run test:petstore | npm run test:toolshop | npm run test:countries | npm run test:smoke
npm run check && npm run format:check
npm run allure:generate && npm run allure:open
npm run discover toolshop && npm run coverage
```

## Public-API notes

- Petstore is shared and public: ~0.6 s/test, occasional 5xx/latency spikes; it accepts many invalid inputs, so L2 tests assert only what it enforces.
- Toolshop is a shared public demo: ~0.5–1 s/call (project timeout 45 s), and the vendor periodically resets its DB, invalidating ids and tokens; a run that overlaps a reset fails in toolshop only. Re-run; don't add retries.
- Countries is read-only and fast; assertions use stable reference data.
- Mock `/__admin/revoke-tokens` clears **all** tokens: harmless at 1 worker; isolate before raising `WORKERS`.
