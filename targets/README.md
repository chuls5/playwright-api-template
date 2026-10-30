# targets

One folder per system under test. Everything specific to a system lives here; `src/` stays generic.

| Target       | What                                                        | Levels |
| ------------ | ----------------------------------------------------------- | ------ |
| `petstore/`  | public Swagger Petstore v3 (REST reference)                 | L0–L2  |
| `mock-bank/` | local mock of banking function-API patterns                 | L0–L2  |
| `toolshop/`  | public Practice Software Testing: JWT roles, cart → invoice | L0–L4  |
| `countries/` | public read-only GraphQL (Countries)                        | L1–L2  |

Layout: `config.ts` · `client.ts`/`schemas.ts` · `fixtures.ts` · `health.setup.ts` · `spec/` · `map/` · `tests/L<n>-<name>/*.L<n>.spec.ts`. New target: `templates/target/`.
