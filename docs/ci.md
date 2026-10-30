# CI

## Jenkins — `Jenkinsfile`

Install → lint + typecheck → `playwright test` (SUITE = smoke | regression, optional PROJECTS) → JUnit + Allure report archived.
Nightly cron on `develop`. Credentials: bind with `withCredentials` per key in `.env.example`; IDs in the file are placeholders.
TODO (your CI): swap the agent label and archive step for your team's conventions and confirm which Allure CLI version it expects.

## GitHub Actions (secondary) — `.github/workflows/`

`pr.yml` (lint, typecheck, smoke; main only accepts develop/release/hotfix) and `nightly.yml` (full run + Allure). Configured, never executed.

## Scaling to 1000+ tests in 30–60 min

Measured here: mock-bank L0–L2 ≈ 50 ms/test, petstore (public internet) ≈ 600 ms/test, both on 1 worker.

- 1000 tests × 0.6 s ≈ 10 min serial against a remote API; a 3–5 s/test average in a slow shared test environment would be 50–80 min → raise `WORKERS` (tests are isolated, `fullyParallel` is already on) or shard: `npx playwright test --shard=1/4` per Jenkins parallel stage, then merge `allure-results/` before `allure generate`.
- Auth cost is fixed per run: service tokens are cached per worker per identity+scope; user step-up is once per created user.
- Keep `@smoke` under ~5 min for PR builds; full regression nightly.
