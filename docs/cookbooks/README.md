# Cookbooks

One page per API type or design pattern: when it applies, how to spot it, the cases, pitfalls. Templates for code are in `templates/`.

| Type                            |          | Pattern                                             |                                  |
| ------------------------------- | -------- | --------------------------------------------------- | -------------------------------- |
| [rest-json](rest-json.md)       |          | [authn-authz](authn-authz.md)                       |                                  |
| [function-api](function-api.md) |          | [idempotency](idempotency.md)                       |                                  |
| [graphql](graphql.md)           |          | [limits-money](limits-money.md)                     |                                  |
| [soap](soap.md)                 | deferred | [business-day-scheduled](business-day-scheduled.md) |                                  |
|                                 |          | [faults-retry](faults-retry.md)                     |                                  |
|                                 |          | [pagination-filtering](pagination-filtering.md)     |                                  |
|                                 |          | [state-async](state-async.md)                       | state machine, 202 polling, ETag |
