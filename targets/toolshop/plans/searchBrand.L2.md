# searchBrand — GET /brands/search?q= (L2)

Sources: as L1. Probe: unmatched `q` → `[]`; missing `q` → 200 with all brands (spec says required; server does not enforce).

| title                                                            | data              | expected                   | tags                                     |
| ---------------------------------------------------------------- | ----------------- | -------------------------- | ---------------------------------------- |
| `GET /brands/search?q=<no match> → 200 empty list`               | random 12 letters | 200, `[]`                  | @L2 @api:searchBrand @pattern:validation |
| `GET /brands/search without q → 200 (not enforced) same as list` | none              | 200, ids ⊇ `getBrands` ids | @L2 @api:searchBrand @pattern:validation |
