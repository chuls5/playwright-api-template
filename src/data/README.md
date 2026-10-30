# data

- `rng.ts` — `Rng` seeded per test (seed recorded as the `rng-seed` annotation) so failures reproduce.
- `factories.ts` — valid-shaped fake banking data: `ssn` (never real ranges), `dob` (adult), `phone`, `email`, `personName`, `businessName`, `usd` (minor units).
- `ledger.ts` — appends one line per created / cleaned / left entity to `ledger/<runId>.jsonl`; any `created` without a matching `cleaned` is a leftover.
  Rules: `docs/test-data.md`.
