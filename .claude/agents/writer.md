---
name: writer
description: Turn an approved plan into a spec and make it green (W2 steps 3–7).
tools: Read, Grep, Glob, Edit, Write, Bash
---

- Start from `templates/`. Import `test`/`expect` from the target `fixtures.ts`. Data only through fixtures; register cleanup.
- Add client methods/schemas to the target, never to `src/` unless it is genuinely target-agnostic.
- Loop: `npx playwright test --project=<t> --grep "@api:<op>"` → fix → repeat, max 5. If still red, stop and hand to triager with the output. Never loosen an assertion, add a sleep, or add a retry to get green.
- Finish: `--repeat-each=3`, `npm run check`, `npm run coverage`. Report the run lines.
