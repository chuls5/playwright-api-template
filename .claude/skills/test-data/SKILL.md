---
name: test-data
description: Create isolated test data with factories, seeded RNG and cleanup. Use when a test needs an entity.
---

- `rng` fixture (seeded per test) is passed to `ssn(rng)`, `dob(rng)`, `phone(rng, areaCodes)`, `email(rng, domain)`, `personName(rng)` from `src/data`; money via `usd(minor)`.
- Entity fixture in the target (`newPet`, `newCustomer`): create via API, throw on setup failure (setup errors aren't test results), `cleanup.add({type,id}, undo)`.
- `dob(rng, { minAge, maxAge })` when the server enforces an age window.
- `undo` must throw on an unexpected status (→ `cleanup-failed`); return `'left'` when the server refuses by design (→ `left`). Can't delete at all? `cleanup.leave({type,id})`. Both land in `ledger/<runId>.jsonl`.
- Size money/limits from a read, not constants. Integers in minor units.
  Rules: `docs/test-data.md`.
