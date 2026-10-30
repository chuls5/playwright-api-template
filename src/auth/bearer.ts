import type { APIRequestContext } from '@playwright/test';
import { TokenCache } from './token-cache';
import type { AuthStrategy, Token } from './types';

/** Generic login → bearer token. `login` performs the target-specific call. */
export function bearerToken(opts: {
  identity: string;
  cache: TokenCache;
  login: (request: APIRequestContext) => Promise<Token>;
  header?: (token: string) => Record<string, string>;
}): AuthStrategy {
  const key = TokenCache.key({ strategy: 'bearer', identity: opts.identity });
  const header = opts.header ?? ((t: string) => ({ Authorization: `Bearer ${t}` }));
  return {
    id: `bearer:${opts.identity}`,
    async headers(request) {
      const t = await opts.cache.get(key, () => opts.login(request));
      return header(t.value);
    },
    invalidate: () => opts.cache.delete(key),
  };
}
