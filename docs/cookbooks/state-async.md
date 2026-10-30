# State machines, async, concurrency

- **State machine:** every allowed transition 2xx; forbidden → 409; terminal states immutable. Build the transition table first; one test per edge.
- **202 + polling:** assert `Location`; `expect.poll(() => get(location), { timeout })` until terminal; test the timeout/failed terminal state.
- **ETag / If-Match:** stale ETag → 412; two concurrent updates → exactly one wins.
