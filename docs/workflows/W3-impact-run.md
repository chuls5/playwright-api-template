# W3 Impact run

1. From the change (diff, changed spec, or ticket) list touched ops/functions.
2. Add their direct neighbours from `map/catalog.json` edges (consumers of what changed).
3. Run: `npx playwright test --grep "@api:(<op1>|<op2>|...)"` plus `--grep @smoke`.
4. Triage failures (triager agent): test bug / product bug / env / flaky. Post the Allure report link and the classification on the PR or ticket.
