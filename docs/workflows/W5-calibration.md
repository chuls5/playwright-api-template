# W5 Calibration on public APIs

Run W1 → W2 on a public API (Petstore, Restful-Booker, Toolshop, Countries GraphQL). After each one, note which skill or cookbook was missing, wrong or ignored, and **edit** it (don't add a new one). Stop when W2 runs on two APIs in a row with no skill edits.

## Log

| Run                            | Found                                                                                                                  | Edited                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Petstore W1→W2                 | `bearer` vs `bearerToken`; missing rng-seed annotation; ledger README wrong                                            | write-api-spec, base fixture, ledger README                     |
| Toolshop W1→W4                 | body ids/tokens not in graph; Laravel 302 without Accept; invoice needs postcode lookup; age 18–75; 409 on user delete | discover + `edges.manual.json`, rest-json, W4, test-data, `dob` |
| Toolshop W2 `getBrand` (agent) | REST templates' import paths one level too deep; spec `example: 1` is wrong (ULIDs); 405 listed on every op            | templates, api-test-plan, rest-json                             |
| Countries GraphQL              | not-found = `null` without errors; Zod 4 `z.undefined()` makes the key required                                        | graphql cookbook                                                |
| Toolshop W2 `searchBrand`      | server ignores `required` on `q` (asserted as observed); earlier `getBrand.md` didn't follow `<op>.L<n>.md` (renamed)  | none                                                            |
| mock W2 restrictions L2        | mock returns 200 `[]` for unknown account on Read (marked mock assumption)                                             | none                                                            |

**Stop rule met (2026-10-30):** two consecutive W2 runs with no skill edits. Re-open W5 when the first real-target operation is done (W2 on a real contract).
