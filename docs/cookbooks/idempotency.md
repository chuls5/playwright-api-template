# Idempotency key

| Case                                | Expected                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------- |
| Same key + same body twice          | same status + body, replay marker if any, side effect once (check balance) |
| Same key + different body           | 409/422                                                                    |
| No key on a money POST              | 400 if required                                                            |
| Retry after a 5xx with the same key | no double effect                                                           |

**Pitfall:** generate the key once per logical operation and reuse it across retries (`RequestOptions.idempotencyKey`). A new key per retry defeats idempotency.
