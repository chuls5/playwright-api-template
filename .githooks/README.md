# .githooks

Enable: `npm run hooks:install`.

- `commit-msg` — rejects non-Conventional-Commit messages.
- `pre-push` — blocks pushing `main`/`develop` directly; runs lint, typecheck, mock smoke.
