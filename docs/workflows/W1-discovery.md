# W1 Discovery

1. Put the contract in `targets/<t>/spec/` (OpenAPI JSON; for function-style platforms: an export from the schema repo; fallback: DTOs in existing client code → Zod by hand, marked low-confidence). Record the source URL/commit in `spec/README.md`.
2. `node tools/discover.ts <t>` → `map/catalog.json` + `map/graph.md`. No OpenAPI? Write `map/catalog.json` by hand (see `targets/mock-bank/map/catalog.json`).
3. Review `graph.md` edges. The heuristic only links path params to the op that returns that id; ids passed in **bodies** (`cart_id`), tokens and state dependencies ("transfer needs elevated token") are invisible. Put fixes in `map/edges.manual.json` (`{ "add": [{from,to,via}], "drop": [{from,to}] }`), never by editing generated files — discover re-merges it every run.
4. Classify each op: API type + patterns (`docs/cookbooks/`). Note it in `map/README.md` if not obvious.
5. `npm run coverage` → `map/coverage.md`. That table is the backlog: work innermost ring first, topological order inside a ring.

Done when: every op is in the catalog, every edge is confirmed or removed, coverage.md is committed.
