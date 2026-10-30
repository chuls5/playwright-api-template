# Coverage model

Graph G=(V,E). V = operations. Edge u→v if (a) a response field of u matches a required input of v (name+schema, or OpenAPI `links`), (b) path nesting (/accounts → /accounts/{id}/transfers), or (c) v needs state that u creates. Roles R act on V; the permission matrix P: R×V→{allow,deny}.

Dimensions per op (cases count when applicable):

| dim             | cases                                                                             | applies when             |
| --------------- | --------------------------------------------------------------------------------- | ------------------------ |
| happy           | 1 per success code                                                                | always                   |
| schema/contract | 1                                                                                 | response has schema      |
| validation      | Σ_required-fields(missing) + Σ_fields(type/format/boundary ≈3)                    | has body/params          |
| authn           | 3 (none, expired, malformed)                                                      | secured                  |
| authz           |                                                                                   | R                        | (allow/deny per role) + 1 BOLA | secured |
| state           | allowed + forbidden transitions                                                   | resource has status enum |
| pattern         | from cookbook (pagination 5, idempotency 3, etag 2, async 3, ratelimit 1, bulk 3) | detected                 |
| money           | amount boundaries 6 + currency 1 + insufficient 1 + limits 3×windows              | money field              |

T(op) = Σ applicable dims. Worked example: POST /transfers, 4 roles, 5 body fields (3 required), idempotent, money with daily+weekly limits:
happy 1 + schema 1 + validation (3 + 5×3=18) + authn 3 + authz 5 + state 0 + idempotency 3 + money (6+1+1+6=14) = 45 cases at L1–L2.
Pairwise role×state only where both apply.

Chains: simple paths in G of length 2–4 consistent with state machine; C = count after pruning paths that do not change observable state. Journeys: named, owner-approved subset of chains (e.g. open account → fund → add payee → transfer → verify both balances).
Total |T| = Σ T(op) + |chains selected| + |journeys|. Roadmap order: topological order, then risk score = money_impact(1–3) × change_freq(1–3) × fan_in.
Estimate: 40 ops × ~30 avg ≈ 1200 L0–L2 tests; plus ~100 chains and ~20 journeys — matches the 1000+ target and ~100/week pace (~12 weeks).

## Revision 2 (function-style platform)

- V for a function-style platform = operations identified by versioned name (`ReadTransactionLimits.v1`). A new version is a new node with an edge `supersedes`, and both stay covered while both are live.
- Identities: customer roles R_c = {PRIMARY, JOINT_OWNER, POWER_OF_ATTORNEY, VIEW_ONLY}. Service identities R_s = service domains. authz cases per op = |R_c| (if customer-facing) + 2 for service (correct scope allow, missing scope deny) + 1 BOLA.
- authn dims by strategy: hmac-service 4 (no token, bad signature, stale timestamp, wrong scope); user-session-mfa 3 (no token, expired, non-elevated session token on step-up op).
- Limits: read-then-size cases = remaining, remaining+1, per-txn max, per-txn max+1 (4 per limit type), no window-roll cases (no clock control).
- Deferred dim: +1 per scheduled/future-dated op (create now, verify on next business day).
- Edges also come from DTO reuse in existing client code (same DTO as response of u and request of v) and from call order inside an existing suite's steps (recorded as `observed` edges, higher confidence).
  Revised example, POST transfer function, customer-facing, idempotent, daily+weekly limits: happy 1 + schema 1 + validation 21 + authn 3 + authz (4+2+1=7) + idempotency 3 + money 8 + limits 8 + deferred 1 = 53.
  Later-phase adapter ops (NACHA/ACH/wire file, SFTP, MQ) are nodes marked `adapter:pending`; they count in |T| as todo, not hidden.

## Revision 3

- authn for hmac-service: no token, bad signature, wrong version, stale timestamp, scope outside allowlist, expired token → re-sign once (6). For user-session-mfa: no token, expired, non-elevated on step-up op, wrong OTP, SSN step-up success, SSN step-up wrong (6).
- idempotency dim (3): same key + same body → same result with no duplicate (check the balance or the transaction list); new key → new entity; same key + different body → rejected.
- headers dim (1): missing x-correlation-id / user-id / role → expected error (TODO confirm behaviour).
- POA column added at a cost of 1 test per op/role cell.
- Seed size: ~40 operations × ~35 avg ≈ 1,400 L0–L2 cases, plus chains and journeys.
  Revised transfer example: happy 1 + schema 1 + validation 21 + authn 6 + authz 7 + idempotency 3 + headers 1 + money 8 + limits 8 + deferred 1 = 57.

## In this repo

- Levels are encoded in file names (`*.L<n>.spec.ts`) and tags (`@L<n>`); ops in `@api:` tags.
- `node tools/discover.ts <target>` → `targets/<t>/map/catalog.json` + `graph.md` (OpenAPI targets).
- `npm run coverage` → `targets/<t>/map/coverage.md`: ops × levels table + Mermaid graph coloured by highest level reached. Counts are tag occurrences, an approximation of test count.
