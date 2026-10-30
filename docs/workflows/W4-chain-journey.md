# W4 Chain / journey (L3, L4)

Template: `templates/chain.L3.spec.ts.tmpl` (same shape for L4). Worked examples: `targets/toolshop/tests/L3-chain/`, `L4-journey/`.

1. Pick a path in `map/graph.md` (L3: 2–4 ops sharing state; L4: a named business flow). Heuristic edges miss ids passed in bodies and tokens: if the path needs one, add it to `map/edges.manual.json` and re-run discover.
2. Reuse L1 clients and fixtures — no HTTP code in the spec. Every created entity comes from a fixture (cleanup registered); a missing factory goes into `fixtures.ts` first.
3. One `test.step` per op (or tight group of ops); assert each step's status and **return** the state the next step needs.
4. Read what the server derives (lookups, prices, generated addresses) in an earlier step; never hard-code it. On shared/public envs, writes use a freshly created actor, so "exactly N" list assertions hold.
5. End with invariants: totals = Σ price × qty (compare in minor units); sum of balances unchanged on internal transfers; created entities visible through the read API. L4 also ends with isolation: another actor gets 404/403, an admin sees it.
6. Tag `@L3`/`@L4` and every `@api:` in the path. Chains on remote envs take 10+ calls; set the project timeout, not per-test sleeps.
