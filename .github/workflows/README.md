# workflows

| File            | Trigger                                   | What                                                                       |
| --------------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| `pr.yml`        | PR → develop/main                         | lint, typecheck, prettier, impact-selected or `@smoke` tests; check `gate` |
| `nightly.yml`   | 09:00 UTC cron, `workflow_dispatch`       | full regression → Allure report on Pages (history kept) + artifact         |
| `api-tests.yml` | `workflow_call` (reusable, sharding-able) | shared test job; service repos call it as a gate                           |

Details: `docs/ci.md`.
