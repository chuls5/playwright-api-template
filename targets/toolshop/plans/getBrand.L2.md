# getBrand — GET /brands/{brandId}

| title                                                          | data     | expected                                    | tags                                 |
| -------------------------------------------------------------- | -------- | ------------------------------------------- | ------------------------------------ |
| `GET /brands/{id} for an unknown ULID → 404 not-found message` | 26 × `0` | 404, `{message:"Requested item not found"}` | @L2 @api:getBrand @pattern:not-found |

Dropped: 405 (method-not-allowed is router boilerplate on every op, not this op's behaviour). Assumption: the spec's `example: 1` is wrong — ids are 26-char ULIDs; the list is the only id source.
