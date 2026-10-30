# GraphQL

**Spot it:** single `/graphql` endpoint, SDL/introspection.

| Ring | Cases                                                                                                                                                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| L1   | Each query/mutation: `data` matches schema, `errors` absent                                                                                                                                                                    |
| L2   | Invalid field → 200 with `errors[]` (not a 4xx!) — assert on `errors[0].message`/`extensions.code`; missing required variable; wrong variable type; authz per field (field null + error); depth/complexity limit if configured |

**Pitfalls:** status is usually 200 even on errors — always check `errors`. Use variables, never string-interpolate into the query. Not-found is usually `data.<field>: null` with **no** `errors` — assert it explicitly, it is not a failure. A read-only schema rejects mutations with 200 + `errors`. In Zod 4, "no errors" is `errors: z.never().optional()` (`z.undefined()` makes the key required).

**Shape:** client with one method per root field over `gql(query, variables)`; `@api:` tag = root field name. Example: `targets/countries/`.
