# Business day / scheduled / deferred

- Known-answer dates: weekday → next day, Friday → Monday, day before holiday, holiday + weekend.
- Get future dates from the calendar API itself, not from local date math, so tests follow the system's holiday list.
- Today → DATE_NOT_IN_FUTURE; weekend/holiday → NOT_BUSINESS_DAY.
- Deferred effects (posted next business day): tag `@deferred`, record the entity with `cleanup.leave`, verify in a later run (nightly) — not with a sleep.
