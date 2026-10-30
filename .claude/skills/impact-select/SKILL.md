---
name: impact-select
description: From a code or contract change, produce the grep expression of tests to run. Use for W3.
---

1. Changed ops = ops in the diff (spec diff, controller paths, function names).
2. Add direct consumers from `map/catalog.json` edges.
3. `--grep "@api:(A|B|C)"` + always `@smoke`. Escape dots in function ids: `@api:ReadAccounts\.v1`.
