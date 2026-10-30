/** Opt-in retry for tests that need it. Fixed delay, explicit status list. Never used implicitly. */
export async function withRetry<T extends { status: number }>(
  fn: () => Promise<T>,
  o: { attempts: number; delayMs: number; on: readonly number[] },
): Promise<T> {
  let last = await fn();
  for (let i = 1; i < o.attempts && o.on.includes(last.status); i++) {
    await new Promise((r) => setTimeout(r, o.delayMs));
    last = await fn();
  }
  return last;
}
