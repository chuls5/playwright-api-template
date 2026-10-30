# countries

Public read-only GraphQL API (`COUNTRIES_BASE_URL`, default `https://countries.trevorblades.com/`, endpoint `graphql`), no auth. Run: `npm run test:countries`. Proves `docs/cookbooks/graphql.md`.

- `@api:` tags use the root field name (`country`, `countries`, `continents`) — no OpenAPI, so no map/coverage.
- Observed: not-found is `data.country: null` with no `errors`; validation errors and the rejected mutation are HTTP 200 + `errors[]`.
