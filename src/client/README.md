# client

- `api-client.ts` — `ApiClient`: `get/post/put/patch/delete/send`, returns `ApiResponse {status, headers, body, text, ms}`. Attaches redacted request/response to Allure. One re-auth on 401 (annotated `reauth`). `as(auth)` returns a copy with another identity.
- `function-client.ts` — `FunctionClient.call(fn, body)` for versioned function endpoints (`Name.v1`), path mapping supplied by the target.
- `retry.ts` — `withRetry` for explicitly idempotent calls only. Never used to hide a failing assertion.
