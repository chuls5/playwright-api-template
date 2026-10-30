---
name: journey-builder
description: Build an L3 chain or L4 journey from a path in the graph. Use after the path's ops are L2-green.
---

Follow `docs/workflows/W4-chain-journey.md`. Start from `templates/chain.L3.spec.ts.tmpl`. One `test.step` per op, reuse fixtures/clients, each step returns what the next needs. Read server-derived data (lookups, prices) in a step, never hard-code it; writes on shared envs use a fresh actor fixture; compare money in minor units. Finish with invariants (totals = Σ price × qty, balances conserved, entity visible via read) and, for L4, isolation (another actor 404/403). Missing edge in the graph → `map/edges.manual.json`.
