# reporting

`redact.ts` masks values whose key matches `SENSITIVE_KEYS` (passwords, secrets, tokens, OTPs, SSNs, auth headers) before anything is attached. `allure.ts` — `attachJson`.

`suiteLabels` (auto via base fixture) builds the Allure tree target › level › op. `markEnvUnavailable(info, reason)` labels a failure as environment. Categories live in `reporting/categories.json`, are written to `allure-results/`, and are loaded by `allurerc.mjs`. Rule order: Environment / infra → Test defect → Product defect; the first match wins.
