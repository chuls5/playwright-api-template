# Definition of done (every PR)

- [ ] `npm run check` clean (lint + typecheck), Prettier clean
- [ ] New/changed tests green 3× (`--repeat-each=3`); `@smoke` green
- [ ] Titles `<op> <condition> → <expected>`; tags: level + `@api:`
- [ ] Assertions cover status **and** body (and the side effect, for writes)
- [ ] Data only via target fixtures; cleanup registered or `leave`d with reason
- [ ] No secrets, tokens, real PII; credentials via env/config
- [ ] No `waitForTimeout`, `test.only`, unconditional skip, hidden retry
- [ ] Nothing target-specific added to `src/`
- [ ] `npm run coverage` re-run; README of any changed folder still true
- [ ] Reviewer agent findings resolved or answered
