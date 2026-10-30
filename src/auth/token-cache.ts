import type { Token } from './types';

const REFRESH_MARGIN_MS = 60_000;

/** In-memory token cache keyed by strategy|identity|sorted scopes|env. One per worker process. */
export class TokenCache {
  private readonly map = new Map<string, Token>();
  private readonly defaultTtlMs: number;
  constructor(defaultTtlMs: number) {
    this.defaultTtlMs = defaultTtlMs;
  }

  static key(parts: { strategy: string; identity: string; scopes?: readonly string[]; env?: string }): string {
    return [parts.strategy, parts.identity, [...(parts.scopes ?? [])].sort().join(','), parts.env ?? ''].join('|');
  }

  async get(key: string, mint: () => Promise<Token>): Promise<Token> {
    const hit = this.map.get(key);
    if (hit && (hit.expiresAt ?? 0) - REFRESH_MARGIN_MS > Date.now()) return hit;
    const fresh = await mint();
    const token = { ...fresh, expiresAt: fresh.expiresAt ?? Date.now() + this.defaultTtlMs };
    this.map.set(key, token);
    return token;
  }

  delete(key: string): void {
    this.map.delete(key);
  }
}
