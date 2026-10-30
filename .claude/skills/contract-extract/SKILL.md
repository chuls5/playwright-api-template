---
name: contract-extract
description: Turn a contract (OpenAPI, Java DTO, sample traffic) into Zod schemas in targets/<t>/schemas.ts.
---

- OpenAPI: one Zod object per component schema; `required` → non-optional; enums → `z.enum`; formats as refinements only if the API enforces them.
- Java DTO: fields + types; `@JsonProperty` names; `@NotNull` → required; `@Size/@Min/@Max` → refinements; enums → `z.enum`; nested DTOs → nested objects. Mark the file header "extracted from DTO <path>@<commit>, low confidence".
- Recorded traffic: infer, mark low confidence, prefer `.passthrough()`.
- Response schemas strict enough to catch drift, loose enough not to fail on additive fields (no `.strict()` unless the contract forbids extras).
