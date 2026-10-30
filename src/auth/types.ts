import type { APIRequestContext } from '@playwright/test';

export interface Token {
  value: string;
  /** epoch ms; undefined = unknown, the cache applies its TTL. */
  expiresAt?: number;
}

/** One way of authenticating. Strategies never touch tests; clients call `headers()` per request. */
export interface AuthStrategy {
  readonly id: string;
  /** Headers to add to an outgoing request (e.g. Authorization). */
  headers(request: APIRequestContext): Promise<Record<string, string>>;
  /** Drop cached credentials so the next call re-authenticates (used for one re-sign on 401). */
  invalidate(): void;
}

export const noAuth: AuthStrategy = { id: 'none', headers: async () => ({}), invalidate: () => {} };
