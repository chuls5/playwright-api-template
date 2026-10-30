---
name: run-and-triage
description: Run a selection of tests and classify failures. Use after changes or a red CI run.
---

Run: `npx playwright test --project=<t> --grep "<expr>"` (tags: `@L1`, `@smoke`, `@api:<op>`, `@pattern:<p>`). Report: `npx allure generate allure-results -o allure-report`, or `playwright-report/`.
Classify each failure: product bug / test bug / env / flaky (rerun `--repeat-each=5`). Evidence = status, body, correlation id from the failure message. Never fix by editing the assertion.
