# getBrand — GET /brands/{brandId}

| title                                                  | data                      | expected                                     | tags              |
| ------------------------------------------------------ | ------------------------- | -------------------------------------------- | ----------------- |
| `GET /brands/{id} for a listed brand → 200 same brand` | first id from `getBrands` | 200, `Brand` schema, id/name/slug = list row | @L1 @api:getBrand |

Dropped: 405 (method-not-allowed is router boilerplate on every op, not this op's behaviour). Assumption: the spec's `example: 1` is wrong — ids are 26-char ULIDs; the list is the only id source.
