# Limits and money

- **Read-then-size:** read limit and utilized first; send `limit`, `limit + 1`, and fill the remaining headroom then `+1`. Never hard-code amounts that depend on shared state.
- Money = integer minor units + currency (`usd()`); test 0, negative, fractional, string → 400; above balance → 422 INSUFFICIENT_FUNDS; same from/to → 422.
- Fund the customer for the test (`openingDepositMinor`) so limits, not balance, are what you hit.
- After a successful transfer verify balances moved by exactly the amount (and the sum is unchanged for internal transfers).
