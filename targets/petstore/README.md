# petstore

Public demo API (`PETSTORE_BASE_URL`, default `https://petstore3.swagger.io/api/v3/`), shared by everyone on the internet. Run: `npm run test:petstore`.

- Shared data: random 9-digit ids, every created pet deleted, list assertions only check _our_ entity.
- Known flakiness: occasional 5xx/latency spikes; the server accepts most invalid bodies (tests assert what it actually guarantees and say so in the title).
