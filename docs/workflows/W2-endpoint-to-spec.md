# W2 Endpoint → spec (one op, one level)

1. `git worktree add ../poc-<t>-<op>-L<n> -b feature/<t>-<op>-L<n> develop`
2. **Plan** (planner agent): case table from the op's schema + the matching cookbooks + the coverage model. Columns: title (`<op> <condition> → <expected>`), data, expected status + body, tags. Review the table before code.
3. **Client** exists? If not, add one method to `targets/<t>/client.ts` (or use FunctionClient). Schemas in `schemas.ts`.
4. **Write** (writer agent): start from `templates/`. Data through target fixtures only.
5. `npx playwright test --project=<t> --grep "@api:<op>"` until green, max 5 iterations. Still red → triager: product bug ⇒ `test.fail()` with ticket in title; test bug ⇒ fix; env ⇒ report, don't commit a workaround.
6. Flake check: `--repeat-each=3`. Then `--grep @smoke` for the whole repo.
7. `npm run coverage`, `npm run check`.
8. Commit (`test(<t>): ...`), open PR to `develop` with the template, run the reviewer agent, fix findings. A human merges.
