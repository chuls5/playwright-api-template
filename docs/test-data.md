# Test data

**Rule: every test creates the data it needs, through a fixture, and registers cleanup.** No shared accounts, no order dependence, no reading what another test wrote. This is what lets `fullyParallel` go from 1 worker to N without rewrites.

| Piece            | Where                               | Notes                                                                                                                                                                                                                                                                                            |
| ---------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Seeded RNG       | `src/data/rng.ts`, fixture `rng`    | Seed = `runId                                                                                                                                                                                                                                                                                    | worker | testId | retry`. Same run → reproducible values; set `RUN_ID` to replay. |
| Factories        | `src/data/factories.ts`             | SSN avoids SSA-invalid ranges (000, 666, 9xx; group/serial ≠ 0) unless `invalid: true`. DOB adult 20–100, day ≤ 28. Money = integer minor units + currency, never floats.                                                                                                                        |
| Cleanup          | fixture `cleanup`                   | `add(entity, undo)` → runs LIFO after the test, best-effort; failures become a `cleanup-failed` annotation, never a red test. `leave(entity)` for things that can't be deleted; an `undo` that returns `'left'` records a server-side refusal by design (Toolshop: users owning invoices → 409). |
| Ledger           | `ledger/<runId>.jsonl` (gitignored) | One line per created/cleaned/left entity with the test title. Use it to purge leftovers in shared environments.                                                                                                                                                                                  |
| Target factories | `targets/<t>/fixtures.ts`           | e.g. `newPet()`, `newCustomer({ stakeholders })` — the only place a target creates data.                                                                                                                                                                                                         |

## Shared public APIs (Petstore)

Other people write to the same server. Ids are random 9-digit; tests never assert on list contents they didn't create; read-after-write uses `expect.poll`.

## PII

Synthetic only. Names come from a fixed fake list with random suffixes. Never copy production records into fixtures, `spec/`, or attachments.

## Notes for a real banking target

- Fresh customers per run via onboarding (onboarding service scopes), mirroring `newCustomer` in `targets/mock-bank`.
- Email domain, phone area codes, OTP and passwords come from env (see `.env.example`), not code.
- Retention/purge rules for test applications are usually unknown at first (see `docs/open-questions.md` §5); the ledger is the stop-gap.
