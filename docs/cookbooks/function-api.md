# function-API function call

**Spot it:** POST to a versioned function name (`ReadTransactionLimits.v1`, `.v2`); `x-user-*` headers; auth mode differs by function version (user session token vs service token). Example: `targets/mock-bank`.

- Use `FunctionClient.call(fn, body, opts)`. The function id **is** the `@api:` tag.
- Pin versions: `.v1` and `.v2` are different ops with different auth — test both if both are used.
- Headers: `x-correlation-id` (fresh per call, shown in failures), `x-user-id`, `x-user-role` — supply them from a header provider in fixtures; one test that each missing header → 400.
- Function-level error codes (`LIMIT_EXCEEDED`, `STEP_UP_REQUIRED`) live in the body: assert `code`, not only status.
- No built-in retries in tests: a client SDK's retry masks failures and can regenerate the Idempotency-Key per retry.
