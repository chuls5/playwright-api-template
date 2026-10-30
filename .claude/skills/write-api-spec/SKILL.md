---
name: write-api-spec
description: Write a spec from an approved plan and make it green. Use in W2.
---

1. Copy the closest `templates/*.tmpl` to `tests/L<n>-<name>/<area>.L<n>.spec.ts`.
2. One `test()` per plan row; title and tags exactly from the plan.
3. `expectStatus` + `expectSchema` / body asserts; side effect check for writes.
4. Data only via target fixtures; new entity types get a fixture that calls `cleanup.add`.
5. Run `--grep "@api:<op>"` ≤5 iterations; then `--repeat-each=3`; `npm run check`.
   Forbidden to reach green: sleeps, retries, loosening asserts, `test.skip`.
