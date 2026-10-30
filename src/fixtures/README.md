# fixtures

`base.ts` extends Playwright `test` with `rng`, `cleanup` (`add(entity, undo)` runs undos LIFO after the test; `leave(entity)` records to the ledger) and worker-scoped `ledger`. Targets extend this `test`.
