---
name: api-discovery
description: Turn an API contract into an op catalog, dependency graph and ordered backlog. Use for a new target or a changed spec.
---

1. Get the contract (priority: OpenAPI → schema repo export → DTOs → recorded traffic). Save to `targets/<t>/spec/` with source noted.
2. `node tools/discover.ts <t>` → `map/catalog.json`, `map/graph.md`. Without OpenAPI, write `catalog.json` by hand: `{ops:[{id,method,path}], edges:[{from,to,via}]}`.
3. Edges: u→v when u's output (id, token, date) is v's input, or v needs state u creates. Confirm each heuristic edge. Body ids, tokens and state dependencies are not detected: add/drop them in `map/edges.manual.json` and re-run discover.
4. Classify each op by type and patterns → `docs/cookbooks/README.md`.
5. `npm run coverage` → backlog = innermost ring first, topological order.
