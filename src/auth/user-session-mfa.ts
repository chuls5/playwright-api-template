import type { APIRequestContext } from '@playwright/test';
import type { OtpProvider } from './otp';
import { TokenCache } from './token-cache';
import type { AuthStrategy } from './types';

/**
 * User login → session token, then step-up: read challenges → deliver OTP → answer → elevated session token.
 * Endpoint shapes come from the target (`endpoints`), so the flow is reusable.
 */
export interface UserSessionMfaOptions {
  identity: string; // role name
  userId: string;
  password: string;
  otp: OtpProvider;
  cache: TokenCache;
  endpoints: {
    logon: string;
    /** Tried in order; first non-404 wins (v3 → v2 → v1 fallback). */
    challenges: readonly string[];
    deliver: string;
    answer: string;
  };
  header?: (sessionToken: string) => Record<string, string>;
}

export async function loginWithStepUp(request: APIRequestContext, o: UserSessionMfaOptions): Promise<string> {
  const logon = await request.post(o.endpoints.logon, { form: { UserID: o.userId, Password: o.password } });
  if (!logon.ok()) throw new Error(`logon failed: HTTP ${logon.status()}`);
  const { sessionToken } = (await logon.json()) as { sessionToken: string };
  const auth = { Authorization: `Bearer ${sessionToken}` };

  let challenge: { channelEncryptedValue: string } | undefined;
  for (const url of o.endpoints.challenges) {
    const res = await request.post(url, { headers: auth, data: {} });
    if (res.status() === 404) continue;
    if (!res.ok()) throw new Error(`challenge read failed: HTTP ${res.status()}`);
    challenge = (await res.json()) as { channelEncryptedValue: string };
    break;
  }
  if (!challenge) throw new Error('no challenge endpoint available');

  if (o.otp.type === 'OTP') {
    const d = await request.post(o.endpoints.deliver, { headers: auth, data: { channelEncryptedValue: challenge.channelEncryptedValue } });
    if (!d.ok()) throw new Error(`OTP delivery failed: HTTP ${d.status()}`);
  }
  const up = await request.post(o.endpoints.answer, {
    headers: auth,
    data: { challengeAnswer: { type: o.otp.type, value: await o.otp.answer(), encryptedValue: challenge.channelEncryptedValue } },
  });
  if (!up.ok()) throw new Error(`step-up failed: HTTP ${up.status()}`);
  return ((await up.json()) as { sessionToken: string }).sessionToken;
}

export function userSessionMfa(o: UserSessionMfaOptions): AuthStrategy {
  const key = TokenCache.key({ strategy: 'user-session-mfa', identity: o.identity });
  const header = o.header ?? ((t: string) => ({ Authorization: `Bearer ${t}` }));
  return {
    id: `user-session-mfa:${o.identity}`,
    async headers(request) {
      const t = await o.cache.get(key, async () => ({ value: await loginWithStepUp(request, o) }));
      return header(t.value);
    },
    invalidate: () => o.cache.delete(key),
  };
}
