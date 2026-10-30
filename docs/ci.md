# CI

GitHub Actions is the primary CI (github.com or GitHub Enterprise). The Jenkinsfile is kept as a reference in
[`ci/legacy-jenkins/`](ci/legacy-jenkins/Jenkinsfile) for teams still on Jenkins.

## Workflows — `.github/workflows/`

| Workflow        | Trigger                                          | Jobs                                                                                          |
| --------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `pr.yml`        | PR → `develop` / `main`                          | `select` → `tests` (reusable) → `gate`; `main-only-from-develop` on PRs to main               |
| `nightly.yml`   | cron `0 9 * * *` (02:00 America/Phoenix), manual | `tests` (full, reusable) → `report` (Allure + history) → `deploy` (Pages)                     |
| `api-tests.yml` | `workflow_call`                                  | `static` (lint, typecheck, prettier) · `plan` → `test` (matrix of shards) → `merge` + summary |

- **Test selection on PRs** (`tools/ci-impact.ts`): if only `targets/<t>/` changed, run those targets in full;
  anything shared (`src/`, `mock/`, config, deps) or docs-only → `--grep @smoke`. For a narrower contract-driven run, use
  the impact-select skill and dispatch the nightly with its `grep`.
- **Nightly inputs** (`workflow_dispatch`): `target` (Playwright project), `grep` (tag, e.g. `@smoke`, `@api:X`), `shards`, `publish`.
- **Job summary**: pass / fail / broken / skipped counts from the final attempt of each test (`tools/ci-summary.ts`).
- **Budgets**: test job 60 min, static 10 min. PR runs cancel superseded runs (`concurrency`); nightly runs queue.
- **Retries**: `retries: 1` on CI (`playwright.config.ts`). A test that passes on retry shows as flaky in Allure.
  A public demo API outage is the Environment category, not a product defect; rerun the failed jobs once and note it.
- **Security**: workflow `permissions: contents: read`; only `deploy` gets `pages: write` + `id-token: write`.
  Actions are pinned to commit SHAs (version in the trailing comment). Update them deliberately, e.g. with Dependabot.

## Reporting

- **Artifacts (always, works without Pages)**: `<prefix>-shard-N` (raw results, Playwright HTML, JUnit),
  `<prefix>-results` (merged `allure-results`), and on nightly `allure-report` (static site; open `index.html` or `npx allure open`).
- **GitHub Pages (nightly)**: the Allure 3 report is published by `actions/deploy-pages` at
  `https://<owner>.github.io/<repo>/`. **History**: before generating, `report` downloads the previous
  `history/history.jsonl` from the live site and passes it as `ALLURE_HISTORY_PATH` (`allurerc.mjs`); the new file is
  published with the report, so trends accumulate with no extra branch. If Pages is off or unavailable, the
  workflow skips publishing and the report artifact is the deliverable.
- Enable Pages: Settings → Pages → Source **GitHub Actions**, or
  `gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow`.

## Secrets, variables and environments

| Name                   | Kind                | Use                                                                                     |
| ---------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `CI_RUNS_ON`           | repo/org variable   | Runner labels as JSON: `"ubuntu-latest"` (default) or `["self-hosted","linux","qa"]`    |
| `NIGHTLY_TEST_ENV`     | variable            | `TEST_ENV` for nightly (default `local`)                                                |
| `NIGHTLY_ENVIRONMENT`  | variable            | GitHub environment for nightly secrets (default `ci`)                                   |
| `CA_BUNDLE`            | secret (optional)   | PEM for a corporate proxy / private CA; sets `NODE_EXTRA_CA_CERTS` only when present    |
| keys in `.env.example` | environment secrets | Per-target config/env values; add each to the environment and map it in `api-tests.yml` |

Test jobs run in a GitHub **environment** (`ci` by default), so secrets are scoped per environment (e.g. `qa-e1`,
`qa-e2`) and can carry approvals or branch rules. To pass a target secret, add it under `env:` on the
`playwright test` step, e.g. `MY_TARGET_SECRET: ${{ secrets.MY_TARGET_SECRET }}`. Secret values are masked in logs;
never echo them.

## Runners and sharding

- Hosted: leave `CI_RUNS_ON` unset. Self-hosted / GHE: set it to your labels. Runners need Node 24 (installed by
  `setup-node`, or pre-installed via a tool cache), outbound access to npm (or your registry mirror) and network
  access to the QA targets.
- Sharding is off by default (`shards: 1`). Set `shards: N` (nightly input or caller `with:`) to run N parallel
  `--shard=i/N` jobs; `merge` combines `allure-results` before reporting. Measured here: mock-bank ≈ 50 ms/test,
  petstore ≈ 600 ms/test on 1 worker. 1000 tests at 3–5 s each against a slow shared environment is 50–80 min serial,
  so raise `WORKERS` and/or shards to stay under the 60-min budget. Keep `@smoke` under ~5 min.

## Required checks and branch protection

Settings → Branches (or rulesets) for **`main`** and **`develop`**:

- Require a pull request before merging; require status check **`gate`** (from `pr.yml`), and branches up to date.
- `main`: also restrict who can push; `main-only-from-develop` (rolled into `gate`) rejects PRs not from
  `develop`, `release/*` or `hotfix/*`. Require linear history or merge commits per `docs/git-flow.md`.
- Block force pushes and deletions on both.

## Shift-left gate for service repos

See [`ci/reusable-workflow.md`](ci/reusable-workflow.md).

## GitHub Enterprise migration checklist

- [ ] **Runners**: self-hosted runner group with labels set in `CI_RUNS_ON`; network path from runners to the QA
      environments and to the npm registry or mirror; Node 24 available.
- [ ] **TLS**: if traffic goes through an inspecting proxy, add `CA_BUNDLE`.
- [ ] **Secrets**: create environments (`ci`, `qa-e1`, …) and add the `.env.example` keys as environment secrets;
      retire the Jenkins credentials once runs are green.
- [ ] **Actions**: allow `actions/*` (or mirror them into the enterprise); keep the SHA pins.
- [ ] **Pages**: confirm GitHub Pages is enabled on the GHE server (and whether it is private). If not, use the
      `allure-report` artifact or publish to an internal static host from the `report` job.
- [ ] **Reusable workflows**: put this repo (or an org `.github` repo) where callers can use it, and allow access
      under Settings → Actions → Access for internal/private repos.
- [ ] **Required checks**: add `gate` to `main` and `develop`, and the shift-left job to each service repo.
- [ ] **Schedules**: cron runs on the default branch in UTC; confirm the 09:00 UTC slot fits the environment's maintenance windows.

## Local

`npm run check && npm run format:check && npm test`, then `npm run allure:generate && npm run allure:open`. The
`.githooks/pre-push` hook runs the static checks.
