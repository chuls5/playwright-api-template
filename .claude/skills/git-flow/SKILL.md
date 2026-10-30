---
name: git-flow
description: Branch, commit and PR rules. Use whenever creating a branch, commit or PR.
---

- Branch from `develop`: `feature/<t>-<op>-L<n>`, `fix/<slug>`. `release/*`, `hotfix/*` per `docs/git-flow.md`.
- Commits: `type(scope): subject` (feat fix test docs refactor chore ci build perf style revert). Hook: `.githooks/commit-msg`.
- Never push to `main`/`develop`; never force-push shared branches; PR with `.github/pull_request_template.md`.
