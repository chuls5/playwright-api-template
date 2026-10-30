# Roadmap (spiral outward)

Each API moves outward one ring at a time; a ring is entered only when the inner ring is green for that API.

```mermaid
flowchart LR
  L0[L0 Auth<br/>token, step-up, bad creds] --> L1[L1 Endpoint<br/>happy path, schema]
  L1 --> L2[L2 Pattern / negative / authz<br/>validation, roles, idempotency, limits]
  L2 --> L3[L3 Chain<br/>2–4 ops sharing state]
  L3 --> L4[L4 Journey<br/>business flow end to end]
```

```mermaid
flowchart TB
  P0[P0 scaffold ✅] --> P1[P1 core + petstore ✅]
  P1 --> P1b[P1b mock-bank ✅]
  P1b --> P2[P2/P3 discovery, agents, skills ✅]
  P2 --> P4[P4/P5 chains + journeys + GraphQL]
  P4 --> P7[P7 first real target: L0 in its test env]
```

Live status per phase is in [../STATUS.md](../STATUS.md). Per-API ring reached: `targets/<t>/map/coverage.md`.

## Suggested spiral order for a banking target

1. L0: service tokens per domain identity; user logon + OTP step-up per role.
2. L1: reference reads (next business day, customer info, limits, accounts).
3. L2: authz matrix (4 roles), limits read-then-size, idempotency, restrictions.
4. L3: onboarding → fund → transfer → verify balances and utilized limits.
5. L4: open account → add payee → transfer → statement.
