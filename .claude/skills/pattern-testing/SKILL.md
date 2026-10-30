---
name: pattern-testing
description: Find the cases for a design pattern (authz, idempotency, limits, pagination, faults, business day, state). Use while planning L2.
---

Index: `docs/cookbooks/README.md`. Read the cookbook for each pattern the op shows; every row in its table is a candidate case.
Working examples: `targets/mock-bank/tests/L2-pattern/` (authz-roles, transfer = idempotency + limits + money, business-day, faults).
