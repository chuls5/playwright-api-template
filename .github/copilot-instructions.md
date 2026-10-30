# Copilot instructions

Playwright + TypeScript API tests. Full rules: `CLAUDE.md`, `docs/standards.md`.

- Import `test`/`expect` from the target's `fixtures.ts`, never `@playwright/test`, in specs.
- Every test: `@L<n>` tag, `@api:<op>` tag, title `<op> <condition> → <expected>`.
- Use `expectStatus` + `expectSchema`; check side effects of writes.
- Test data from fixtures (`rng`, `newPet`, `newCustomer`) with `cleanup`; never literals for passwords, secrets, OTPs, SSNs.
- Nothing target-specific in `src/`.
