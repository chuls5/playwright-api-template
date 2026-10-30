# Contributing

1. `git switch develop && git switch -c feature/<target>-<op>-L<n>` (`docs/git-flow.md`).
2. Follow the workflow for the task (`docs/workflows/`), standards in `docs/standards.md`.
3. Before a PR: `npm run check`, `npm run format:check`, changed specs `--repeat-each=3`, `npm run test:smoke`. Checklist: `docs/workflows/definition-of-done.md`.
4. Conventional Commits (`.gitmessage`). PR into `develop` using the template. `main` only via release/hotfix.
5. No secrets, real customer data or real PII anywhere — env keys only.
