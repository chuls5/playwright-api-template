# REST / JSON (OpenAPI)

**Spot it:** `openapi.json`/`swagger.json`, resources under paths, JSON bodies. Example: `targets/petstore`.

| Ring | Cases                                                                                                                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| L1   | Each documented 2xx: status, Zod schema, key fields equal what was sent; `Content-Type`; response time budget                                          |
| L2   | Path param wrong type → 400; unknown id → 404; required field missing / wrong type / out of enum → 400; malformed JSON → 400; each enum value accepted |
| L2   | Unsupported method → 405; wrong `Content-Type` → 415 (if the API documents it)                                                                         |

**Pitfalls:** Frameworks like Laravel answer validation failures with a 302 redirect to HTML unless the request sends `Accept: application/json` (`ApiClient` always does; raw `request` calls must too). Spec `example` values can be wrong (Toolshop documents `brandId: 1`, real ids are ULIDs) — take ids from a list/read call. Error body shapes differ per status (Petstore: 400 is JSON, 404 is plain text) — assert on `text` when not JSON. Shared public servers: never assert list contents you didn't create; use `expect.poll` for read-after-write.
