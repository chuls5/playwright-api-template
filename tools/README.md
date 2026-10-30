# tools

- `discover.ts <target>` — OpenAPI → `map/catalog.json` + `map/graph.md`, merged with hand-written `map/edges.manual.json` if present.
- `coverage.ts` — per target: ops × highest level covered, from `@api:` tags and `.L<n>` filenames → `map/coverage.{json,md}`. Counts are tag occurrences, approximate.
- `eslint-rules/` — repo-local lint rules.
