import { createHmac } from 'node:crypto';
import type { APIRequestContext } from '@playwright/test';
import { TokenCache } from './token-cache';
import type { AuthStrategy } from './types';

/** Produces the signature headers for one token request. Target supplies the scheme. */
export type Signer = (input: { clientId: string; secret: string; nowMs: number }) => Record<string, string>;

/**
 * Service-to-service HMAC token scheme v2 (generic signed-timestamp pattern):
 * data = `${clientId}:${version}:${epochMillis}` (UTF-8), key = base64-decoded secret,
 * signature = base64url(HMAC-SHA256) without padding.
 */
export function hmacV2Signature(clientId: string, base64Secret: string, nowMs: number, version = 2): string {
  const key = Buffer.from(base64Secret, 'base64');
  return createHmac('sha256', key).update(`${clientId}:${version}:${nowMs}`, 'utf8').digest('base64url');
}

export const hmacV2Signer: Signer = ({ clientId, secret, nowMs }) => ({
  'X-Client-Id': clientId,
  'X-Signature-Version': '2',
  'X-Timestamp': String(nowMs),
  'X-Signature': hmacV2Signature(clientId, secret, nowMs),
});

export interface HmacServiceOptions {
  identity: string; // e.g. domain name: core, limits, payments
  clientId: string;
  secret: string; // base64
  scopes: readonly string[];
  tokenUrl: string;
  cache: TokenCache;
  signer?: Signer;
  /** How the token is presented. Default: `Authorization: Bearer <token>`. */
  header?: (token: string) => Record<string, string>;
  parse?: (body: unknown) => string;
}

export function hmacService(o: HmacServiceOptions): AuthStrategy {
  const key = TokenCache.key({ strategy: 'hmac-service', identity: o.identity, scopes: o.scopes });
  const signer = o.signer ?? hmacV2Signer;
  const header = o.header ?? ((t: string) => ({ Authorization: `Bearer ${t}` }));
  const parse = o.parse ?? ((b: unknown) => (b as { authorization_token: string }).authorization_token);
  return {
    id: `hmac-service:${o.identity}`,
    async headers(request: APIRequestContext) {
      const token = await o.cache.get(key, async () => {
        const res = await request.post(o.tokenUrl, {
          headers: signer({ clientId: o.clientId, secret: o.secret, nowMs: Date.now() }),
          data: { scope: [...o.scopes] },
        });
        if (!res.ok()) throw new Error(`service token (${o.identity}) failed: HTTP ${res.status()}`);
        return { value: parse(await res.json()) };
      });
      return header(token.value);
    },
    invalidate: () => o.cache.delete(key),
  };
}
