# CLAUDE.md

Playwright TS API test framework. Read `README.md` for layout; `STATUS.md` for state.

## Rules

- `src/` is target-agnostic. Target specifics → `targets/<t>/`.
- Specs: `targets/<t>/tests/L<n>-<name>/<area>.L<n>.spec.ts`; import `test`/`expect` from the target `fixtures.ts`; tag `@L<n>` + `@api:<op>`; title `<op/path> <condition> → <expected>`.
- Assert status **and** body; schema via `expectSchema`. Data only through fixtures with cleanup. No sleeps, no shared ids, no order dependence.
- Never: secret/password/OTP literals, real PII, weakening an assertion to get green, `test.only`, pushing, committing to `main`/`develop`.
- Done = `npm run check` clean + changed specs pass `--repeat-each=3` + DoD (`docs/workflows/definition-of-done.md`).

## Commands

`npm run test:mock` · `npx playwright test --project=<t> --grep "@api:<op>"` · `npm run check` · `npm run coverage` · `npm run discover <t>`

## Agents & skills

Agents in `.claude/agents/` (cartographer → planner → writer → reviewer; triager on red). Skills in `.claude/skills/`. Workflows W1–W5 in `docs/workflows/`; pattern cookbooks in `docs/cookbooks/`.

- CI is GitHub Actions (`.github/workflows/`, `docs/ci.md`); the required PR check is `gate`. Jenkins is legacy reference only.
