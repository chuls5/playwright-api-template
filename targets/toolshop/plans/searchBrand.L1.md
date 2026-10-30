# searchBrand — GET /brands/search?q= (L1)

Sources: spec (`q` required, 200 BrandResponse[], 404, 405), rest-json cookbook, live probe 2026-10-30. Public op.

| title                                                                   | data                                  | expected                              | tags                 |
| ----------------------------------------------------------------------- | ------------------------------------- | ------------------------------------- | -------------------- |
| `GET /brands/search?q=<upper-cased fragment> → 200 contains that brand` | first brand from `getBrands`, 4 chars | 200, `Brand[]`, contains listed brand | @L1 @api:searchBrand |

Dropped: 404/405 (not produced for this op). Shared env: other users create brands, so assert "contains", never the exact list.
