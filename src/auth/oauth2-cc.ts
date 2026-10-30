import type { APIRequestContext } from '@playwright/test';
import { TokenCache } from './token-cache';
import type { AuthStrategy } from './types';

export function oauth2ClientCredentials(o: {
  identity: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
  cache: TokenCache;
}): AuthStrategy {
  const key = TokenCache.key({ strategy: 'oauth2-cc', identity: o.identity, scopes: o.scope ? [o.scope] : [] });
  return {
    id: `oauth2-cc:${o.identity}`,
    async headers(request: APIRequestContext) {
      const t = await o.cache.get(key, async () => {
        const res = await request.post(o.tokenUrl, {
          form: { grant_type: 'client_credentials', client_id: o.clientId, client_secret: o.clientSecret, ...(o.scope ? { scope: o.scope } : {}) },
        });
        if (!res.ok()) throw new Error(`oauth2 token failed: HTTP ${res.status()}`);
        const b = (await res.json()) as { access_token: string; expires_in?: number };
        return { value: b.access_token, ...(b.expires_in ? { expiresAt: Date.now() + b.expires_in * 1000 } : {}) };
      });
      return { Authorization: `Bearer ${t.value}` };
    },
    invalidate: () => o.cache.delete(key),
  };
}
