---
name: quality-gate
description: Check a branch against the definition of done before opening a PR.
---

Run and report pass/fail per item of `docs/workflows/definition-of-done.md`:
`npm run check` · `npx prettier --check .` · changed specs `--repeat-each=3` · `--grep @smoke` · `git diff develop... -- src/` reviewed for target-specific code · `grep -rEn "(password|secret|otp)\s*[:=]\s*['\"]" targets src` empty.
