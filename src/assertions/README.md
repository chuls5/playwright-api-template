# assertions

`expectStatus(res, 200 | [200, 201])` — fails with method, path, status and body excerpt. `expectSchema(res, Zod)` — returns the typed body. `expectFasterThan(res, ms)` — soft latency guard.
