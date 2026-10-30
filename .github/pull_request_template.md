## What & why

<!-- one or two lines; link the ticket -->

## Coverage

- Target / APIs (`@api:` tags):
- Levels added: L0 / L1 / L2 / L3 / L4
- Cases added vs. planned (from the coverage model):

## Checklist (docs/workflows/definition-of-done.md)

- [ ] `npm run check` clean (lint + typecheck)
- [ ] New/changed tests pass 3× in a row locally (`--repeat-each=3`)
- [ ] Each test creates its own data and registers cleanup (or `cleanup.leave` with reason)
- [ ] No secrets, tokens, real PII; credentials read from env
- [ ] No `waitForTimeout`, no `test.only`, no hidden retries
- [ ] Target-specific code stays in `targets/<id>/` (nothing system-specific in `src/`)
- [ ] READMEs / docs updated if behaviour or layout changed
- [ ] Reviewer agent run (`.claude/agents/reviewer.md`) and findings addressed
