# playwright-api-template

A starting template for API test suites in Playwright + TypeScript. A reusable core lives in `src/`; everything specific to one system under test lives in `targets/<name>/`. It ships with working example targets, including a local mock of common banking / money-movement API patterns.

## What's in it

- **Auth strategies:** bearer, OAuth2 client credentials, HMAC-signed service tokens (with a known-answer test), and user login + OTP step-up with challenge-version fallback. Tokens are cached per worker and re-acquired once on 401.
- **Clients:** `ApiClient` (redacted Allure attachments, correlation ids) and `FunctionClient` (versioned function-style operations).
- **Patterns, with examples on the mock:** authz role matrix, idempotency-key replay rules, limits read-then-size, business-day helper, fault injection, and cleanup + ledger fixtures.
- **Levels:** L0 auth → L1 endpoint → L2 pattern/negative → L3 chain → L4 journey, encoded in file names and tags.
- **Reporting and CI:** Allure 3 with categories (environment vs test vs product defect), JUnit, and GitHub Actions as the CI (PR gate, nightly with the Allure report on Pages, a reusable workflow).

## Quick start

```bash
npm ci                      # API tests need no browsers
cp -n .env.example .env     # key names only; blank = config default
npm run hooks:install       # commit-msg + pre-push hooks
npm test                    # all targets (the mock server starts automatically)
npm run test:mock           # local mock only, no network
npm run test:smoke
npm run allure:generate && npm run allure:open
```

Requires Node ≥ 20.6 (runs `.ts` via Node type stripping; tested on Node 24). Allure CLI 3 (`npx allure`), no Java.

## Layout

| Path                               | What                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `src/`                             | auth strategies, clients, assertions, data, fixtures, redaction               |
| `targets/`                         | `mock-bank`, `petstore`, `toolshop` (L3/L4), `countries` (GraphQL)            |
| `mock/bank/`                       | local banking function-API mock server (Node built-ins only)                  |
| `templates/`                       | spec templates + a new-target skeleton                                        |
| `tools/`                           | discovery, coverage, lint rules                                               |
| `docs/`                            | standards, coverage model, CI, workflows, cookbooks, runbooks, open questions |
| `.claude/`                         | agents + skills; see `CLAUDE.md`, `AGENTS.md`                                 |
| `.github/workflows/`, `docs/ci.md` | CI                                                                            |

## Add a target

1. Copy `templates/target/*.tmpl` to `targets/<name>/` without the `.tmpl` suffix, and fill in `config.ts` (Zod-validated env), `identities.ts` and `health.setup.ts`.
2. Add the env key **names** to `.env.example`; values go in `.env` or CI credentials only.
3. Add `<name>-setup` and `<name>` projects to `playwright.config.ts`.
4. If you have OpenAPI, save it as `targets/<name>/spec/openapi.json` and run `npm run discover <name>`. Then `npm run coverage`.

The step-by-step version is `docs/runbooks/new-target-day-1.md`. For a banking platform, start with `docs/open-questions.md`.

## Agents, skills and workflows

Agents in `.claude/agents/`: cartographer (map the API) → planner (test plan) → writer (specs) → reviewer, with triager on red runs and an orchestrator. Skills in `.claude/skills/` hold the repeatable steps (discovery, test plans, spec writing, pattern testing, impact selection, triage, quality gate). Workflows W1–W5 in `docs/workflows/` chain them: discovery, endpoint → spec, impact run, chain/journey, calibration. Cookbooks in `docs/cookbooks/` cover each pattern. Rules for agents are in `CLAUDE.md` / `AGENTS.md`.

Status and counts: `STATUS.md`. Conventions: `CONTRIBUTING.md`. License: MIT.
