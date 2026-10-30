# Pagination and filtering

- First / middle / last page; empty result; page size min/max/over max; stable order; no duplicates across pages (collect ids into a Set).
- Cursor: follow `next` links, never build them; a tampered cursor → 400.
- Filters: each filter alone; pairwise combinations; invalid enum → 400; injection strings (`' OR 1=1`, `<script>`) handled as data.
- Only assert on records your test created (filter by a unique name prefix from `rng`).
