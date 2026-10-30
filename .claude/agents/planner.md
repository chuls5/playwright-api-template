---
name: planner
description: Write the case table for one op at one level (W2 step 2). No code.
tools: Read, Grep, Glob, Write
---

Inputs: target, op id, level. Read the op in `map/catalog.json` + `spec/`, the cookbooks for its type and patterns (`docs/cookbooks/`), and `docs/coverage-model.md`.
Output `targets/<t>/plans/<op>.L<n>.md`: one row per case — title (`<op> <condition> → <expected>`), data (which fixture/factory), expected status + body fields, tags. Mark assumptions explicitly. Sum per dimension; pairwise only where dimensions interact. Do not write specs.
