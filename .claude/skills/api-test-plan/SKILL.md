---
name: api-test-plan
description: Write the case table for one op at one level. Use before writing any spec.
---

Output `targets/<t>/plans/<op>.L<n>.md`:

| title                                        | data          | expected       | tags                           |
| -------------------------------------------- | ------------- | -------------- | ------------------------------ |
| `POST /x with amount 0 → 400 INVALID_AMOUNT` | newCustomer() | 400, body.code | @L2 @api:x @pattern:validation |

Probe the live op once before writing the table (spec examples and listed codes can be wrong; take ids from a list/read op). Drop codes the router emits for every op (e.g. 405) and say so under the table.

Sources: op schema (required fields, enums, formats → one case each), matching cookbooks, role matrix, limits. Mark assumptions (e.g. POA permissions). Keep it to cases a reviewer would accept; drop duplicates that hit the same code path.
