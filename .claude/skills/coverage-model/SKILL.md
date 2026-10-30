---
name: coverage-model
description: Decide how many tests an op needs and what to do next. Use when planning scope or answering "how much is covered".
---

- Levels: L0 auth → L1 endpoint → L2 pattern/negative/authz → L3 chain → L4 journey. A ring opens only when the inner ring is green for that op.
- Cases per op = sum over applicable dimensions (validation fields, enums, roles, patterns). Pairwise only where dimensions interact (role × state). Never the full Cartesian product.
- Priority = money impact × change frequency × fan-in (edges out in `map/catalog.json`).
- Current state: `targets/<t>/map/coverage.md` (regenerate with `npm run coverage`).
  Worked example: `docs/coverage-model.md` (transfer = 57 cases).
