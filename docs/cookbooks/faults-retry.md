# Faults and retries

- 500/504 surface as-is (no hidden retry). Retry only via `withRetry({attempts, delayMs, on:[503]})`, only where the product contract says clients retry.
- Flaky dependency (fails n times then passes): with retry → pass; without → the failure is visible.
- Latency: assert `durationMs` budgets with `expectFasterThan`; latency injection to prove the budget fails when it should.
- 429: own lane (`@ratelimit`), nightly only; assert `Retry-After`.
  Mock switches: `x-mock-fault: 500 | 504 | 401 | delay:<ms> | flaky:<n>:<key>`.
