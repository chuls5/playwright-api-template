# templates

Starting points for the writer agent. Copy, rename to `<area>.L<n>.spec.ts`, replace `__PLACEHOLDERS__`. `.tmpl` so lint/typecheck skip them.

| File                            | Use for                                                        |
| ------------------------------- | -------------------------------------------------------------- |
| `rest-endpoint.L1.spec.ts.tmpl` | REST happy path + schema                                       |
| `rest-negative.L2.spec.ts.tmpl` | REST validation table                                          |
| `function-call.L1.spec.ts.tmpl` | function-API function happy path                               |
| `authz-matrix.L2.spec.ts.tmpl`  | role × capability matrix                                       |
| `chain.L3.spec.ts.tmpl`         | L3 chain or L4 journey with `test.step` (W4)                   |
| `target/`                       | skeleton for a new target (`config.ts`, `fixtures.ts`, README) |
